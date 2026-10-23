import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ChevronDown, Phone, MessageCircle, Mail, MapPin, Briefcase, Shield, Users, UserRound, HeartHandshake, Filter, Send, FileSpreadsheet, FileText, Printer, Pencil, Archive, AlertCircle, ChevronRight } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import type { Guardian } from '../../data/types';
import { PageHead, Tabs, Field, SearchInput, Avatar, StatusBadge, Menu, Pager, usePaged, Empty, StatCard, Modal, toast, useIsDesktop, Card } from '../../components/ui';
import { fullName, norm, downloadCSV, dateLong } from '../../lib/format';
import { useSession, audit } from '../../lib/session';
import { printDocument } from '../../lib/print';
import { GuardianListSheet, GuardianSheet } from '../../docs/Sheets';
import { ParentAccess } from './ParentAccess';

const LIENS: Guardian['lien'][] = ['Père', 'Mère', 'Tuteur', 'Tutrice', 'Grand-père', 'Grand-mère', 'Oncle', 'Tante', 'Frère', 'Sœur', 'Autre'];

export default function Parents() {
  const nav = useNavigate();
  const session = useSession()!;
  const canWrite = session.can('parents', 'write');
  const [params, setParams] = useSearchParams();
  const guardians = useCollection('guardians');
  const students = useCollection('students');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const desktop = useIsDesktop();
  const [tab, setTab] = useState<'liste' | 'classe' | 'stats'>('liste');
  const [classe, setClasse] = useState('all');
  const [statut, setStatut] = useState('all');
  const [lien, setLien] = useState('all');
  const [q, setQ] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [edit, setEdit] = useState<Partial<Guardian> | null>(null);
  const [perPage, setPerPage] = useState(10);

  const kids = useMemo(() => {
    const m = new Map<string, typeof students>();
    for (const s of students) if (s.statut !== 'Archivé') for (const g of s.tuteurIds) m.set(g, [...(m.get(g) ?? []), s]);
    return m;
  }, [students]);
  const code = (id: string) => classes.find((c) => c.id === id)?.code ?? '';
  const list = useMemo(() => {
    const n = norm(q);
    return guardians.filter((g) => {
      const k = kids.get(g.id) ?? [];
      if (classe !== 'all' && !k.some((s) => s.classeId === classe)) return false;
      if (statut !== 'all' && g.statut !== statut) return false;
      if (lien === 'parents' && !['Père', 'Mère'].includes(g.lien)) return false;
      if (lien === 'grands' && !g.lien.startsWith('Grand')) return false;
      if (lien === 'autres' && ['Père', 'Mère', 'Grand-père', 'Grand-mère'].includes(g.lien)) return false;
      return !n || norm(`${g.prenom} ${g.nom} ${g.telephone} ${g.email ?? ''}`).includes(n);
    });
  }, [guardians, kids, classe, statut, lien, q]);
  const paged = usePaged(list, perPage);
  const selected = guardians.find((g) => g.id === params.get('id')) ?? (desktop ? list[0] : undefined);
  const sel = list.filter((g) => checked[g.id]);
  const target = sel.length ? sel : list;

  const exportCSV = () => downloadCSV('parents.csv', [['Nom', 'Prénom', 'Lien', 'Téléphone', 'Email', 'Élèves', 'Classes', 'Statut'], ...target.map((g) => [g.nom, g.prenom, g.lien, g.telephone, g.email, (kids.get(g.id) ?? []).map(fullName).join(', '), (kids.get(g.id) ?? []).map((s) => code(s.classeId)).join(', '), g.statut])]);
  const smsAll = () => nav(`/communication?canal=SMS&cible=${sel.length ? 'selection' : 'tous'}`);

  return (
    <>
      <PageHead title="Parents / Tuteurs" sub="Gérez les parents, tuteurs et grands-parents. Retrouvez facilement les contacts selon les classes ou les élèves."
        actions={<>
          <Menu trigger={<button className="btn">Exporter<ChevronDown /></button>} items={[
            { label: 'Exporter vers Excel', icon: <FileSpreadsheet />, onClick: exportCSV },
            { label: 'Générer une liste (PDF)', icon: <FileText />, onClick: () => printDocument(<GuardianListSheet guardians={target} kids={kids} code={code} />, 'A4 portrait') },
          ]} />
          {canWrite && <button className="btn btn-primary" onClick={() => setEdit({ lien: 'Père', sexe: 'M', statut: 'Actif', principal: true })}><Plus />Ajouter un parent</button>}
        </>} />
      <div className="grid g-stats mb-16">
        <StatCard tint="blue" icon={<Users />} value={guardians.length} label="Parents / Tuteurs" sub="Total enregistrés" />
        <StatCard tint="green" icon={<UserRound />} value={guardians.filter((g) => (kids.get(g.id) ?? []).some((s) => s.statut === 'Actif')).length} label="Parents actifs" sub="Avec au moins un élève" />
        <StatCard tint="violet" icon={<HeartHandshake />} value={guardians.filter((g) => g.lien.startsWith('Grand')).length} label="Grands-parents" sub="Enregistrés comme tuteurs" />
        <StatCard tint="orange" icon={<Shield />} value={guardians.filter((g) => !['Père', 'Mère', 'Grand-père', 'Grand-mère'].includes(g.lien)).length} label="Autres tuteurs" sub="(Oncles, tantes, etc.)" />
      </div>
      <Tabs tabs={[['liste', 'Liste des parents'], ['classe', 'Par classe'], ['stats', 'Statistiques']]} value={tab} onChange={setTab} />

      {tab === 'liste' && (
        <div className="split split-wide">
          <div className="stack filters">
            <div className="card card-pad stack" style={{ gap: 14 }}>
              <div className="row between"><b className="row" style={{ color: 'var(--ink)' }}><Filter size={16} color="var(--primary)" />Filtres</b><button className="small" style={{ border: 0, background: 'none', color: 'var(--primary)' }} onClick={() => { setClasse('all'); setStatut('all'); setLien('all'); setQ(''); }}>Réinitialiser</button></div>
              <Field label="Classe"><select className="select" value={classe} onChange={(e) => setClasse(e.target.value)}><option value="all">Toutes les classes</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></Field>
              <Field label="Statut"><select className="select" value={statut} onChange={(e) => setStatut(e.target.value)}><option value="all">Tous les statuts</option><option>Actif</option><option>Inactif</option></select></Field>
              <Field label="Type de lien"><select className="select" value={lien} onChange={(e) => setLien(e.target.value)}><option value="all">Tous (Parents, grands-parents...)</option><option value="parents">Parents</option><option value="grands">Grands-parents</option><option value="autres">Autres tuteurs</option></select></Field>
              <Field label="Recherche"><SearchInput value={q} onChange={setQ} placeholder="Nom, téléphone, email..." /></Field>
            </div>
            <div className="card card-pad only-desktop qa-hide">
              <h3 style={{ fontSize: 16 }} className="mb-12">Actions rapides</h3>
              <div className="qa">
                <button onClick={() => nav('/communication?canal=Email')}><Mail style={{ color: 'var(--violet)' }} />Contacter par email</button>
                <button onClick={smsAll}><MessageCircle style={{ color: 'var(--green)' }} />Envoyer un SMS</button>
                <button onClick={() => printDocument(<GuardianListSheet guardians={target} kids={kids} code={code} />, 'A4 portrait')}><FileText style={{ color: 'var(--red)' }} />Générer une liste (PDF)</button>
                <button onClick={exportCSV}><FileSpreadsheet style={{ color: 'var(--green)' }} />Exporter vers Excel</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3 style={{ fontSize: 18 }}>Parents / Tuteurs ({list.length})</h3>{sel.length > 0 && <span className="small muted">{sel.length} sélectionné(s)</span>}</div>
            {list.length === 0 ? <Empty title="Aucun parent trouvé" /> : desktop ? (
              <div className="table-wrap" style={{ padding: '0 12px' }}>
                <table className="t t-compact" style={{ border: '1px solid var(--line)' }}>
                  <thead><tr><th><input type="checkbox" checked={paged.items.every((g) => checked[g.id])} onChange={(e) => setChecked({ ...checked, ...Object.fromEntries(paged.items.map((g) => [g.id, e.target.checked])) })} /></th><th>Nom</th><th>Lien</th><th className="c">Élève(s)</th><th>Classe(s)</th><th>Téléphone</th><th>Statut</th><th>Actions</th></tr></thead>
                  <tbody>{paged.items.map((g) => {
                    const k = kids.get(g.id) ?? [];
                    return (
                      <tr key={g.id} className={`clickable ${selected?.id === g.id ? 'selected' : ''}`} onClick={() => setParams({ id: g.id }, { replace: true })}>
                        <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={!!checked[g.id]} onChange={(e) => setChecked({ ...checked, [g.id]: e.target.checked })} /></td>
                        <td><div className="person"><Avatar src={g.photo} name={fullName(g)} size={30} /><b style={{ color: 'var(--primary)' }}>{fullName(g)}</b></div></td>
                        <td className="muted">{g.lien}</td><td className="c">{k.length}</td>
                        <td>{[...new Set(k.map((s) => code(s.classeId)))].join(', ')}</td><td style={{ whiteSpace: 'nowrap' }}>{g.telephone}</td>
                        <td><StatusBadge s={g.statut} /></td>
                        <td><Menu items={[{ label: 'Appeler', icon: <Phone />, onClick: () => (location.href = `tel:${g.telephone}`) }, { label: 'WhatsApp', icon: <MessageCircle />, onClick: () => window.open(`https://wa.me/${g.telephone.replace(/\D/g, '')}`) }, ...(canWrite ? [{ label: 'Modifier', icon: <Pencil />, onClick: () => setEdit(g) }] : [])]} /></td>
                      </tr>);
                  })}</tbody>
                </table>
              </div>
            ) : (
              <div className="list">{paged.items.map((g) => (
                <button key={g.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)' }} onClick={() => setParams({ id: g.id }, { replace: true })}>
                  <Avatar src={g.photo} name={fullName(g)} size={42} />
                  <div className="grow"><div style={{ fontWeight: 600, color: 'var(--ink)' }}>{fullName(g)}</div><div className="tiny muted">{g.lien} · {g.telephone}</div></div>
                  <ChevronRight className="chev" />
                </button>))}</div>
            )}
            <Pager {...paged} perPage={perPage} onPerPage={setPerPage} />
          </div>

          {desktop ? selected && <GuardianPanel g={selected} kids={kids.get(selected.id) ?? []} onEdit={() => setEdit(selected)} /> : (
            <Modal open={!!selected} onClose={() => setParams({}, { replace: true })} title="Parent / Tuteur" size="lg">
              {selected && <GuardianPanel g={selected} kids={kids.get(selected.id) ?? []} onEdit={() => setEdit(selected)} />}
            </Modal>
          )}
        </div>
      )}

      {tab === 'classe' && (
        <div className="grid g-3">
          {classes.map((c) => {
            const gs = guardians.filter((g) => (kids.get(g.id) ?? []).some((s) => s.classeId === c.id && s.statut === 'Actif'));
            return (
              <Card key={c.id} title={`${c.code} · ${gs.length} parents`} link="Voir" onLink={() => { setClasse(c.id); setTab('liste'); }}>
                <div className="small muted">Joignables par WhatsApp : <b style={{ color: 'var(--ink)' }}>{gs.filter((g) => g.whatsapp).length}</b> · Email : <b style={{ color: 'var(--ink)' }}>{gs.filter((g) => g.email).length}</b></div>
                <button className="btn btn-soft btn-sm mt-12" onClick={() => nav(`/communication?cible=classe&classe=${c.id}`)}><Send size={14} />Écrire aux parents</button>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid g-2">
          <Card title="Répartition par lien">
            {LIENS.map((l) => ({ l, n: guardians.filter((g) => g.lien === l).length })).filter((x) => x.n).map(({ l, n }) => (
              <div key={l} className="row" style={{ padding: '5px 0' }}><span style={{ width: 110 }}>{l}</span><div className="bar grow"><i style={{ width: `${(n / guardians.length) * 100}%`, background: 'var(--primary)' }} /></div><b style={{ width: 40, textAlign: 'right' }}>{n}</b></div>
            ))}
          </Card>
          <Card title="Moyens de contact">
            <div className="info">
              <div>Avec téléphone</div><div>{guardians.filter((g) => g.telephone).length}</div>
              <div>Avec WhatsApp</div><div>{guardians.filter((g) => g.whatsapp).length}</div>
              <div>Avec email</div><div>{guardians.filter((g) => g.email).length}</div>
              <div>Parents de plusieurs élèves</div><div>{guardians.filter((g) => (kids.get(g.id) ?? []).length > 1).length}</div>
            </div>
          </Card>
        </div>
      )}

      {edit && <GuardianForm value={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function GuardianPanel({ g, kids, onEdit }: { g: Guardian; kids: { id: string; prenom: string; nom: string; photo?: string; classeId: string; statut: string }[]; onEdit: () => void }) {
  const nav = useNavigate();
  const session = useSession()!;
  const classes = useCollection('classes');
  const messages = useCollection('messages');
  const [tab, setTab] = useState<'enfants' | 'infos' | 'comm'>('enfants');
  const canWrite = session.can('parents', 'write');
  const wa = `https://wa.me/${(g.whatsapp ?? g.telephone).replace(/\D/g, '')}`;
  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="row" style={{ alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <Avatar src={g.photo} name={fullName(g)} size={84} square />
          <div className="grow" style={{ minWidth: 160 }}>
            <div className="row wrap"><h2 style={{ fontSize: 19 }}>{fullName(g)}</h2><StatusBadge s={g.statut} /></div>
            <div className="small" style={{ lineHeight: 1.7, marginTop: 4 }}>{g.lien} de {kids.length} élève(s)<br />{g.principal ? 'Parent principal' : 'Contact secondaire'}</div>
          </div>
          {canWrite && <button className="btn btn-primary" onClick={onEdit}>Modifier</button>}
        </div>
        <div className="form-grid small mt-16" style={{ gap: 10 }}>
          <div className="row"><Phone size={17} color="var(--primary)" />{g.telephone}
            <a className="btn btn-sm btn-soft btn-icon" href={`tel:${g.telephone}`} aria-label="Appeler"><Phone size={14} /></a>
            <a className="btn btn-sm btn-soft btn-icon" href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={14} /></a></div>
          <div className="row"><Mail size={17} color="var(--primary)" /><span className="ellipsis">{g.email ?? '-'}</span></div>
          <div className="row"><MapPin size={17} color="var(--primary)" />{g.adresse ?? '-'}</div>
          <div className="row"><Briefcase size={17} color="var(--primary)" />Profession : {g.profession ?? '-'}</div>
        </div>
        {g.adresse && <a className="btn btn-sm mt-12" href={`https://www.google.com/maps/search/${encodeURIComponent(g.adresse + ', Haïti')}`} target="_blank" rel="noreferrer"><MapPin size={14} />Voir sur la carte</a>}
      </div>
      <div className="pills">{([['enfants', `Enfants (${kids.length})`], ['infos', 'Informations'], ['comm', 'Communication']] as const).map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'enfants' && (
        <div className="card list">{kids.map((s) => (
          <button key={s.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)' }} onClick={() => nav(`/eleves/${s.id}`)}>
            <Avatar src={s.photo} name={fullName(s)} size={38} /><span className="grow" style={{ fontWeight: 500, color: 'var(--ink)' }}>{fullName(s)}</span>
            <span className="small" style={{ width: 54 }}>{classes.find((c) => c.id === s.classeId)?.code}</span><StatusBadge s={s.statut} /><ChevronRight className="chev" />
          </button>))}{kids.length === 0 && <Empty title="Aucun élève lié" />}
        </div>
      )}
      {tab === 'infos' && (
        <div className="card card-pad">
          <h3 style={{ fontSize: 16 }} className="mb-8">Informations personnelles</h3>
          <div className="info">
            <div>Date de naissance</div><div>{g.dateNaissance ? dateLong(g.dateNaissance) : '-'}</div>
            <div>Sexe</div><div>{g.sexe === 'F' ? 'Féminin' : 'Masculin'}</div>
            <div>Nationalité</div><div>{g.nationalite ?? '-'}</div>
            <div>Adresse</div><div>{g.adresse ?? '-'}</div>
            <div>Autres contacts</div><div>{g.whatsapp ? `${g.whatsapp} (WhatsApp)` : '-'}</div>
            <div>Email</div><div>{g.email ?? '-'}</div>
            <div>Type de lien</div><div>{g.lien}</div>
            <div>Statut</div><div style={{ color: g.statut === 'Actif' ? 'var(--green)' : 'var(--orange)' }}>{g.statut}</div>
            <div>Notes</div><div>{g.notes ?? '-'}</div>
          </div>
        </div>
      )}
      {tab === 'comm' && (
        <div className="card card-pad">
          <p className="small muted mb-12">Messages envoyés à tous les parents ou aux classes de ses enfants.</p>
          {messages.filter((m) => (m.relance ? kids.some((k) => k.id === m.relance!.eleveId) : m.cible === 'Tous les parents' || kids.some((k) => k.classeId === m.classeId))).map((m) => (
            <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line-2)' }}><b style={{ color: 'var(--ink)' }}>{m.objet}</b> <span className="tiny muted">· {m.canal}</span><div className="small muted">{m.contenu}</div></div>
          ))}
        </div>
      )}
      <ParentAccess g={g} canWrite={canWrite} />
      <div className="grid g-2" style={{ gap: 12 }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 15 }} className="mb-12">Actions rapides</h3>
          <div className="qa">
            <a href={wa} target="_blank" rel="noreferrer"><MessageCircle />Envoyer un message</a>
            <a href={`tel:${g.telephone}`}><Phone />Appeler</a>
            {g.email && <a href={`mailto:${g.email}`}><Mail />Envoyer un email</a>}
            <button onClick={() => printDocument(<GuardianSheet g={g} kids={kids} />, 'A4 portrait')}><Printer />Générer une fiche (PDF)</button>
            {canWrite && <button className="danger" onClick={() => { db.patch('guardians', g.id, { statut: g.statut === 'Actif' ? 'Inactif' : 'Actif' }); toast('Statut mis à jour'); }}><Archive />{g.statut === 'Actif' ? 'Désactiver' : 'Réactiver'}</button>}
          </div>
        </div>
        {g.principal && (
          <div className="card card-pad" style={{ background: 'var(--orange-50)', border: 0 }}>
            <b className="row" style={{ color: 'var(--ink)' }}><AlertCircle size={18} color="var(--orange)" />Note importante</b>
            <p className="small mt-8" style={{ color: '#6b5a3a' }}>Ce parent reçoit toutes les communications de l’école (notes, retards, réunions, etc.).</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function GuardianForm({ value, onClose }: { value: Partial<Guardian>; onClose: () => void }) {
  const [f, setF] = useState<Partial<Guardian>>(value);
  const set = (k: keyof Guardian, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (!f.nom || !f.prenom || !f.telephone) return toast('Nom, prénom et téléphone requis', true);
    db.put('guardians', { statut: 'Actif', principal: true, nationalite: 'Haïtienne', ...f, whatsapp: f.whatsapp || f.telephone } as Guardian);
    audit(value.id ? 'Modification parent' : 'Ajout parent', `${f.prenom} ${f.nom}`);
    toast('Parent enregistré');
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={value.id ? 'Modifier le parent' : 'Ajouter un parent'} size="lg" footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={save}>Enregistrer</button></>}>
      <div className="form-grid">
        <Field label="Nom" req><input className="input" value={f.nom ?? ''} onChange={(e) => set('nom', e.target.value)} /></Field>
        <Field label="Prénom" req><input className="input" value={f.prenom ?? ''} onChange={(e) => set('prenom', e.target.value)} /></Field>
        <Field label="Lien"><select className="select" value={f.lien} onChange={(e) => set('lien', e.target.value)}>{LIENS.map((l) => <option key={l}>{l}</option>)}</select></Field>
        <Field label="Sexe"><select className="select" value={f.sexe} onChange={(e) => set('sexe', e.target.value)}><option value="M">Masculin</option><option value="F">Féminin</option></select></Field>
        <Field label="Téléphone" req><input className="input" type="tel" value={f.telephone ?? ''} onChange={(e) => set('telephone', e.target.value)} placeholder="+509" /></Field>
        <Field label="WhatsApp" opt><input className="input" type="tel" value={f.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} placeholder="Si différent" /></Field>
        <Field label="Email" opt><input className="input" type="email" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Profession" opt><input className="input" value={f.profession ?? ''} onChange={(e) => set('profession', e.target.value)} /></Field>
        <Field label="Adresse" className="span-2"><input className="input" value={f.adresse ?? ''} onChange={(e) => set('adresse', e.target.value)} /></Field>
        <Field label="Notes" opt className="span-2"><textarea className="textarea" value={f.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
        <label className="check"><input type="checkbox" checked={!!f.principal} onChange={(e) => set('principal', e.target.checked)} />Contact principal (reçoit toutes les communications)</label>
      </div>
    </Modal>
  );
}

