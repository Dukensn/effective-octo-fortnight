// Formulaire du registre de discipline : signaler un incident (ou des félicitations) et le suivre.
import { useMemo, useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { db, useCollection } from '../data/store';
import { INCIDENT_TYPES, SANCTIONS, type Incident, type Student } from '../data/types';
import { Avatar, Field, Modal, SearchInput, Toggle, toast } from './ui';
import { civ, dateLong, fullName, norm, todayISO } from '../lib/format';
import { audit, useSession } from '../lib/session';

export const GRAVITES: NonNullable<Incident['gravite']>[] = ['Légère', 'Moyenne', 'Grave'];
export const incidentTone = (i: Pick<Incident, 'type' | 'gravite'>) =>
  i.type === 'Félicitations' ? 'green' : i.gravite === 'Grave' ? 'red' : i.gravite === 'Moyenne' ? 'orange' : 'gray';

/** Lien WhatsApp vers le parent principal, avec un message déjà rédigé. */
export function parentWhatsApp(inc: Incident) {
  const s = db.get('students', inc.eleveId);
  const g = s && db.get('guardians', s.tuteurIds[0]);
  const school = db.get('school', 'main');
  if (!s || !g?.telephone) return null;
  const txt = inc.type === 'Félicitations'
    ? `Bonjour ${civ(g)}, ${school?.nom} a le plaisir de vous informer que ${s.prenom} a été félicité${s.sexe === 'F' ? 'e' : ''} le ${dateLong(inc.date)} : ${inc.description} Bravo !`
    : `Bonjour ${civ(g)}, ${school?.nom} vous informe d’un incident concernant ${s.prenom} ${s.nom} le ${dateLong(inc.date)} (${inc.type.toLowerCase()}) : ${inc.description}${inc.sanction ? ` Mesure prise : ${inc.sanction.toLowerCase()}${inc.joursExclusion ? ` (${inc.joursExclusion} jour${inc.joursExclusion > 1 ? 's' : ''})` : ''}.` : ''} Merci de prendre contact avec la direction.`;
  return `https://wa.me/${g.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`;
}

export function IncidentForm({ value, students, onClose }: { value: Partial<Incident>; students?: Student[]; onClose: () => void }) {
  const session = useSession()!;
  const all = useCollection('students');
  const classes = useCollection('classes');
  const pool = students ?? all.filter((s) => s.statut === 'Actif');
  const [f, setF] = useState<Partial<Incident>>({ date: todayISO(), type: 'Indiscipline', gravite: 'Légère', statut: 'Ouvert', parentsPrevenus: false, ...value });
  const [q, setQ] = useState('');
  const set = <K extends keyof Incident>(k: K, v: Incident[K]) => setF((x) => ({ ...x, [k]: v }));
  const eleve = all.find((s) => s.id === f.eleveId);
  const felicitations = f.type === 'Félicitations';
  const matches = useMemo(() => {
    const n = norm(q.trim());
    if (n.length < 2) return [];
    return pool.filter((s) => norm(`${s.prenom} ${s.nom} ${s.matricule}`).includes(n)).slice(0, 6);
  }, [q, pool]);

  const save = () => {
    if (!f.eleveId) return toast('Choisissez un élève', true);
    if (!f.description?.trim()) return toast('Décrivez ce qui s’est passé', true);
    const doc = {
      ...f,
      classeId: eleve?.classeId,
      gravite: felicitations ? undefined : f.gravite,
      sanction: felicitations ? undefined : f.sanction || undefined,
      joursExclusion: f.sanction === 'Exclusion temporaire' ? f.joursExclusion ?? 1 : undefined,
      statut: felicitations ? 'Clôturé' : f.statut,
      auteurId: f.auteurId ?? session.user.staffId,
    } as Incident;
    const saved = db.put('incidents', doc);
    audit(value.id ? 'Modification incident' : 'Signalement incident', `${fullName(eleve)} · ${f.type}`);
    toast(value.id ? 'Incident mis à jour' : felicitations ? 'Félicitations enregistrées' : 'Incident enregistré');
    onClose();
    return saved;
  };
  const wa = f.eleveId && f.description ? parentWhatsApp(f as Incident) : null;

  return (
    <Modal open onClose={onClose} title={value.id ? 'Incident' : 'Signaler'}
      footer={<>
        {value.id && session.can('discipline', 'write') && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => { db.remove('incidents', value.id!); audit('Suppression incident', fullName(eleve)); toast('Incident supprimé'); onClose(); }}><Trash2 /></button>}
        <button className="btn" onClick={onClose}>Annuler</button>
        <button className="btn btn-primary" onClick={save}>Enregistrer</button>
      </>}>
      <div className="stack" style={{ gap: 14 }}>
        {/* Pas de <label> ici : le clic sur la liste serait renvoyé au bouton « Changer ». */}
        <div className="field">
          <span>Élève</span>
          {eleve ? (
            <div className="row" style={{ padding: '6px 0' }}>
              <Avatar src={eleve.photo} name={fullName(eleve)} size={40} />
              <div className="grow"><b style={{ color: 'var(--ink)' }}>{fullName(eleve)}</b><div className="tiny muted">{classes.find((c) => c.id === eleve.classeId)?.code} · {eleve.matricule}</div></div>
              {!value.id && <button type="button" className="btn btn-sm" onClick={() => setF((x) => ({ ...x, eleveId: undefined }))}>Changer</button>}
            </div>
          ) : (
            <>
              <SearchInput value={q} onChange={setQ} placeholder="Nom, prénom ou matricule…" />
              {matches.length > 0 && (
                <div className="pick-list mt-8">
                  {matches.map((s) => (
                    <button key={s.id} type="button" onClick={() => { set('eleveId', s.id); setQ(''); }}>
                      <Avatar src={s.photo} name={fullName(s)} size={32} /><span className="grow">{fullName(s)}<small className="muted" style={{ display: 'block' }}>{classes.find((c) => c.id === s.classeId)?.code}</small></span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="form-grid">
          <Field label="Date"><input type="date" className="input" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label="Type">
            <select className="select" value={f.type} onChange={(e) => set('type', e.target.value as Incident['type'])}>{INCIDENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
        </div>
        {!felicitations && (
          <Field label="Gravité">
            <div className="seg">{GRAVITES.map((g) => <button type="button" key={g} className={f.gravite === g ? 'active' : ''} onClick={() => set('gravite', g)}>{g}</button>)}</div>
          </Field>
        )}
        <Field label={felicitations ? 'Motif des félicitations' : 'Ce qui s’est passé'}>
          <textarea className="textarea" value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder={felicitations ? 'Ex. Aide spontanée à un camarade.' : 'Faits observés, lieu, heure…'} />
        </Field>
        {!felicitations && (
          <div className="form-grid">
            <Field label="Mesure prise" opt>
              <select className="select" value={f.sanction ?? ''} onChange={(e) => set('sanction', e.target.value || undefined)}>
                <option value="">Aucune pour l’instant</option>
                {SANCTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            {f.sanction === 'Exclusion temporaire' && <Field label="Nombre de jours"><input type="number" min={1} max={15} className="input" value={f.joursExclusion ?? 1} onChange={(e) => set('joursExclusion', Number(e.target.value))} /></Field>}
          </div>
        )}
        {!felicitations && (
          <div className="stack" style={{ gap: 10 }}>
            <label className="row between"><span>Parents prévenus</span><Toggle on={!!f.parentsPrevenus} onChange={(v) => set('parentsPrevenus', v)} label="Parents prévenus" /></label>
            <label className="row between"><span>Dossier clôturé</span><Toggle on={f.statut === 'Clôturé'} onChange={(v) => set('statut', v ? 'Clôturé' : 'Ouvert')} label="Dossier clôturé" /></label>
          </div>
        )}
        {wa && <a className="btn btn-soft" href={wa} target="_blank" rel="noreferrer" onClick={() => set('parentsPrevenus', true)}><MessageCircle />Prévenir le parent par WhatsApp</a>}
      </div>
    </Modal>
  );
}
