// Relances de paiement : élèves en retard, message personnalisé, envoi WhatsApp / SMS un par un et suivi.
import { useMemo, useState } from 'react';
import { MessageCircle, Smartphone, Copy, PenLine, Send, SkipForward, BellRing } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import type { Student } from '../../data/types';
import { Avatar, Empty, Modal, Pills, Toggle, toast } from '../../components/ui';
import { fullName, money, norm, timeAgo } from '../../lib/format';
import { balances } from '../../lib/finance';
import { useSession, audit } from '../../lib/session';
import { CHAMPS, MODELE_DEFAUT, relanceAutoOf, runAutoRelances, contactOf, fillModele, loadModele, recordRelance, relanceLink, relancesByStudent, saveModele } from '../../lib/relance';

type Filtre = 'tous' | 'jamais' | 'semaine';
const DAY = 86400000;

export default function Relances({ classe, q, canWrite }: { classe: string; q: string; canWrite: boolean }) {
  const session = useSession()!;
  const students = useCollection('students');
  const classes = useCollection('classes');
  const messages = useCollection('messages');
  useCollection('payments');
  useCollection('guardians');
  const school = useDoc('school', 'main');
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [modele, setModele] = useState(loadModele);
  const [edit, setEdit] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<string[] | null>(null);
  const b = balances();
  const sent = relancesByStudent(messages);
  const code = (s: Student) => classes.find((c) => c.id === s.classeId)?.code;

  const debtors = useMemo(() => students
    .filter((s) => s.statut === 'Actif' && (b.get(s.id)?.rest ?? 0) > 0 && (classe === 'all' || s.classeId === classe) && (!q || norm(fullName(s)).includes(norm(q))))
    .filter((s) => {
      const r = sent.get(s.id);
      return filtre === 'tous' || (filtre === 'jamais' ? !r : !r || Date.now() - r.last > 7 * DAY);
    })
    .sort((x, y) => (b.get(y.id)?.rest ?? 0) - (b.get(x.id)?.rest ?? 0)), [students, b, classe, q, filtre, sent]); // eslint-disable-line

  const total = debtors.reduce((a, s) => a + (b.get(s.id)?.rest ?? 0), 0);
  const allPicked = debtors.length > 0 && debtors.every((s) => picked.has(s.id));
  const toggle = (id: string) => { const n = new Set(picked); if (n.has(id)) n.delete(id); else n.add(id); setPicked(n); };
  const textFor = (s: Student) => fillModele(modele, s, contactOf(s), b.get(s.id)?.rest ?? 0);

  const send = (s: Student, canal: 'WhatsApp' | 'SMS') => {
    const g = contactOf(s);
    const tel = g?.whatsapp && canal === 'WhatsApp' ? g.whatsapp : g?.telephone;
    if (!tel) return toast('Aucun numéro pour ce parent', true);
    const text = textFor(s);
    window.open(relanceLink(canal, tel, text), '_blank');
    recordRelance(canal, s, g, b.get(s.id)?.rest ?? 0, text, session.user.id);
  };
  const copy = async (s: Student) => {
    try { await navigator.clipboard.writeText(textFor(s)); toast('Message copié'); } catch { toast('Copie impossible sur cet appareil', true); }
  };

  const auto = relanceAutoOf();
  const setAuto = (p: Partial<typeof auto>) => db.patch('school', 'main', { relanceAuto: { ...auto, ...p } });
  return (
    <>
      <div className="card card-pad mb-16 auto-relance">
        <div className="row" style={{ gap: 12 }}>
          <span className="row-ic tint-green"><BellRing /></span>
          <span className="grow"><b style={{ color: 'var(--ink)' }}>Relances automatiques</b><div className="small muted">{auto.actif ? `Le parent reçoit un rappel dans l’application tous les ${auto.jours} jours tant qu’il reste au moins ${money(auto.minimum)} à payer.` : 'Arrêtées : aucun rappel automatique n’est envoyé.'}</div></span>
          {canWrite && <Toggle on={auto.actif} label="Relances automatiques" onChange={(v) => { setAuto({ actif: v }); toast(v ? 'Relances automatiques activées' : 'Relances automatiques arrêtées'); }} />}
        </div>
        {canWrite && auto.actif && (
          <div className="row wrap mt-12" style={{ gap: 8 }}>
            <span className="small muted">Fréquence :</span>
            {[7, 14, 30].map((j) => <button key={j} className={`chip ${auto.jours === j ? 'active' : ''}`} onClick={() => setAuto({ jours: j })}>{j === 7 ? 'Chaque semaine' : j === 14 ? 'Toutes les 2 semaines' : 'Chaque mois'}</button>)}
            <span className="small muted" style={{ marginLeft: 8 }}>À partir de</span>
            <select className="select" style={{ width: 120 }} value={auto.minimum} onChange={(e) => setAuto({ minimum: Number(e.target.value) })}>{[500, 1000, 5000, 10000].map((m) => <option key={m} value={m}>{money(m)}</option>)}</select>
            <button className="btn btn-sm" onClick={() => { const n = runAutoRelances(session.user.id); toast(n ? `${n} parent(s) relancé(s)` : 'Personne à relancer aujourd’hui'); }}><Send size={14} />Envoyer maintenant</button>
          </div>
        )}
      </div>
      <div className="card card-pad mb-16 stack" style={{ gap: 12 }}>
        <div className="row wrap between" style={{ gap: 10 }}>
          <div className="small"><b style={{ color: 'var(--ink)' }}>{debtors.length}</b> élève(s) · <b style={{ color: 'var(--red)' }}>{money(total, school?.monnaie)}</b> à recouvrer</div>
          <Pills items={[['tous', 'Tous'], ['jamais', 'Jamais relancés'], ['semaine', 'Pas relancés depuis 7 jours']]} value={filtre} onChange={setFiltre} />
        </div>
        <div className="relance-model">
          <div className="grow small">{debtors[0] ? textFor(debtors[0]) : modele}</div>
          {canWrite && <button className="btn btn-sm" onClick={() => setEdit(true)}><PenLine size={14} />Modifier le message</button>}
        </div>
        {canWrite && (
          <div className="row wrap" style={{ gap: 8 }}>
            <label className="check small"><input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(debtors.map((s) => s.id)))} />Tout sélectionner</label>
            <button className="btn btn-primary btn-sm" disabled={!picked.size} onClick={() => setQueue(debtors.filter((s) => picked.has(s.id)).map((s) => s.id))}><Send size={14} />Relancer la sélection ({picked.size})</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="table-wrap"><table className="t">
          <thead><tr>{canWrite && <th style={{ width: 36 }} />}<th>Élève</th><th className="num">Restant</th><th>Parent</th><th>Dernière relance</th>{canWrite && <th title="Relance automatique">Auto</th>}<th /></tr></thead>
          <tbody>{debtors.slice(0, 150).map((s) => {
            const g = contactOf(s);
            const r = sent.get(s.id);
            return (
              <tr key={s.id}>
                {canWrite && <td><input type="checkbox" aria-label={`Sélectionner ${fullName(s)}`} checked={picked.has(s.id)} onChange={() => toggle(s.id)} style={{ width: 18, height: 18 }} /></td>}
                <td><div className="person"><Avatar src={s.photo} name={fullName(s)} size={28} /><span><b>{fullName(s)}</b><br /><span className="tiny muted">{code(s)}</span></span></div></td>
                <td className="num bold" style={{ color: 'var(--red)' }}>{money(b.get(s.id)!.rest)}</td>
                <td className="small">{g ? <>{g.prenom} {g.nom}<br /><span className="muted">{g.whatsapp ?? g.telephone}</span></> : <span className="muted">Aucun parent</span>}</td>
                <td className="small">{r ? <>{timeAgo(r.last)}<br /><span className="muted">{r.count} relance(s)</span></> : <span className="muted">Jamais</span>}</td>
                {canWrite && <td><Toggle on={!s.relanceAutoOff} label={`Relance automatique pour ${fullName(s)}`} onChange={(v) => { db.patch('students', s.id, { relanceAutoOff: !v }); audit(v ? 'Relances automatiques reprises' : 'Relances automatiques arrêtées', fullName(s), { domaine: 'finance' }); }} /></td>}
                <td>{canWrite && g && <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-sm btn-soft" onClick={() => send(s, 'WhatsApp')}><MessageCircle size={14} />WhatsApp</button>
                  <button className="btn btn-sm" onClick={() => send(s, 'SMS')} aria-label="SMS"><Smartphone size={14} />SMS</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => copy(s)} aria-label="Copier le message"><Copy size={14} /></button>
                </div>}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
        {debtors.length === 0 && <Empty title={filtre === 'tous' ? 'Aucun élève en retard de paiement' : 'Tout le monde a déjà été relancé'} />}
      </div>

      {edit && <ModelEditor value={modele} sample={debtors[0]} onClose={() => setEdit(false)} onSave={(t) => { setModele(t); saveModele(t); setEdit(false); toast('Message enregistré'); }} />}
      {queue && <Queue ids={queue} textFor={textFor} onSend={send} onClose={() => { setQueue(null); setPicked(new Set()); }} />}
    </>
  );
}

function ModelEditor({ value, sample, onClose, onSave }: { value: string; sample?: Student; onClose: () => void; onSave: (t: string) => void }) {
  const [t, setT] = useState(value);
  const b = balances();
  return (
    <Modal open onClose={onClose} title="Message de relance" footer={<><button className="btn btn-ghost" style={{ marginRight: 'auto' }} onClick={() => setT(MODELE_DEFAUT)}>Message par défaut</button><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" disabled={!t.trim()} onClick={() => onSave(t.trim())}>Enregistrer</button></>}>
      <textarea className="input" rows={5} value={t} onChange={(e) => setT(e.target.value)} />
      <p className="tiny muted mt-8">Remplacés pour chaque parent : {CHAMPS.map((c) => <button key={c} type="button" className="chip" style={{ height: 26, margin: '4px 4px 0 0' }} onClick={() => setT(`${t} ${c}`)}>{c}</button>)}</p>
      {sample && <div className="relance-model mt-12"><div className="small"><b>Aperçu :</b> {fillModele(t, sample, contactOf(sample), b.get(sample.id)?.rest ?? 0)}</div></div>}
    </Modal>
  );
}

/** Envoi un par un : WhatsApp et SMS ne permettent pas l'envoi groupé depuis un navigateur. */
function Queue({ ids, textFor, onSend, onClose }: { ids: string[]; textFor: (s: Student) => string; onSend: (s: Student, c: 'WhatsApp' | 'SMS') => void; onClose: () => void }) {
  const students = useCollection('students');
  const [i, setI] = useState(0);
  const s = students.find((x) => x.id === ids[i]);
  const g = s && contactOf(s);
  const next = () => (i + 1 < ids.length ? setI(i + 1) : (toast(`${ids.length} relance(s) traitée(s)`), onClose()));
  if (!s) return null;
  return (
    <Modal open onClose={onClose} title={`Relance ${i + 1} sur ${ids.length}`} footer={<><button className="btn" onClick={next}><SkipForward size={14} />Passer</button><button className="btn" onClick={() => { onSend(s, 'SMS'); next(); }}><Smartphone size={14} />SMS</button><button className="btn btn-primary" onClick={() => { onSend(s, 'WhatsApp'); next(); }}><MessageCircle size={14} />WhatsApp</button></>}>
      <div className="bar mb-16"><i style={{ width: `${(i / ids.length) * 100}%`, background: 'var(--primary)' }} /></div>
      <div className="row mb-12"><Avatar src={s.photo} name={fullName(s)} size={40} /><div><b style={{ color: 'var(--ink)' }}>{fullName(s)}</b><div className="tiny muted">{g ? `${g.prenom} ${g.nom} · ${g.whatsapp ?? g.telephone}` : 'Aucun parent'}</div></div></div>
      <div className="relance-model"><div className="small">{textFor(s)}</div></div>
      <p className="tiny muted mt-12">Chaque bouton ouvre WhatsApp ou les SMS avec le message prêt : appuyez sur Envoyer, puis revenez ici pour le suivant.</p>
    </Modal>
  );
}
