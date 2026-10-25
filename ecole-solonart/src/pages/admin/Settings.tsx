import { useEffect, useRef, useState } from 'react';
import { approveRequest, findByEmail, googleAvailable, newSchoolCode, putAccount, refuseRequest, resetLocalPassword } from '../../lib/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Plus, Download, RotateCcw, Cloud, CloudOff, KeyRound, Trash2, ShieldCheck, Check, Share2 } from 'lucide-react';
import { db, eraseDemo, useCollection, useDoc } from '../../data/store';
import { enterDemo, isDemo, leaveDemo, onlineConfigured } from '../../data/mode';
import type { Access, ModuleKey, Period, Role, School, Subject, User } from '../../data/types';
import { PageHead, Tabs, Field, Card, Modal, toast, Avatar, Badge, Toggle, Confirm } from '../../components/ui';
import { readFileAsDataURL, downloadBlob, timeAgo, civ, dateLong } from '../../lib/format';
import { lastExport, listSnapshots, restoreSnapshot, shareBackup } from '../../lib/backup';
import { useSession, audit } from '../../lib/session';
import { firebaseEnabled, useSyncState, SCHOOL_ID, pushOutbox } from '../../data/sync';
import { SchoolLogo } from '../../components/Logo';
import { Signature, Seal } from '../../docs/common';

type Tab = 'ecole' | 'annee' | 'scolarite' | 'utilisateurs' | 'roles' | 'donnees';
const MODULES: [ModuleKey, string][] = [['dashboard', 'Tableau de bord'], ['eleves', 'Élèves'], ['inscriptions', 'Inscriptions'], ['classes', 'Classes'], ['parents', 'Parents'], ['personnel', 'Personnel'], ['emploi', 'Emploi du temps'], ['notes', 'Notes / Examens'], ['presences', 'Présences'], ['discipline', 'Discipline'], ['cahier', 'Cahier de textes'], ['finance', 'Finance'], ['documents', 'Documents'], ['communication', 'Communication'], ['rapports', 'Rapports'], ['parametres', 'Paramètres'], ['utilisateurs', 'Utilisateurs & rôles']];

export default function SettingsPage() {
  const [params] = useSearchParams();
  const session = useSession()!;
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) ?? 'ecole');
  const tabs: [Tab, string][] = [['ecole', 'École'], ['annee', 'Année & périodes'], ['scolarite', 'Matières & barème'], ...(session.can('utilisateurs') ? [['utilisateurs', 'Utilisateurs'], ['roles', 'Rôles & permissions']] as [Tab, string][] : []), ['donnees', 'Données & synchronisation']];
  return (
    <>
      <PageHead title="Paramètres" sub="Informations de l’école, année scolaire, barème, accès des utilisateurs et sauvegarde." />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'ecole' && <SchoolTab />}
      {tab === 'annee' && <YearTab />}
      {tab === 'scolarite' && <SubjectsTab />}
      {tab === 'utilisateurs' && <UsersTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'donnees' && <DataTab />}
    </>
  );
}

function useCanEdit() { return useSession()!.can('parametres', 'write'); }

function SchoolTab() {
  const school = useDoc('school', 'main')!;
  const canEdit = useCanEdit();
  const [f, setF] = useState<School>(school);
  const set = (k: keyof School, v: unknown) => setF({ ...f, [k]: v });
  const upload = async (k: 'logo' | 'signatureDirecteur' | 'cachet', file?: File) => { if (!file) return; const url = await readFileAsDataURL(file, 500); db.patch('school', 'main', { [k]: url }); setF((x) => ({ ...x, [k]: url })); toast('Image enregistrée'); };
  return (
    <div className="split split-side">
      <Card title="Informations de l’école">
        <div className="form-grid">
          <Field label="Nom de l’école" className="span-2"><input className="input" disabled={!canEdit} value={f.nom} onChange={(e) => set('nom', e.target.value)} /></Field>
          <Field label="Devise"><input className="input" disabled={!canEdit} value={f.devise} onChange={(e) => set('devise', e.target.value)} /></Field>
          <Field label="Slogan"><input className="input" disabled={!canEdit} value={f.slogan} onChange={(e) => set('slogan', e.target.value)} /></Field>
          <Field label="Adresse"><input className="input" disabled={!canEdit} value={f.adresse} onChange={(e) => set('adresse', e.target.value)} /></Field>
          <Field label="Commune"><input className="input" disabled={!canEdit} value={f.commune} onChange={(e) => set('commune', e.target.value)} /></Field>
          <Field label="Département"><select className="select" disabled={!canEdit} value={f.departement} onChange={(e) => set('departement', e.target.value)}>{['Ouest', 'Artibonite', 'Centre', 'Grand’Anse', 'Nippes', 'Nord', 'Nord-Est', 'Nord-Ouest', 'Sud', 'Sud-Est'].map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Code MENFP" opt><input className="input" disabled={!canEdit} value={f.numeroMenfp ?? ''} onChange={(e) => set('numeroMenfp', e.target.value)} /></Field>
          <Field label="Téléphone"><input className="input" disabled={!canEdit} value={f.telephone} onChange={(e) => set('telephone', e.target.value)} /></Field>
          <Field label="Email"><input className="input" disabled={!canEdit} value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Site web"><input className="input" disabled={!canEdit} value={f.siteWeb} onChange={(e) => set('siteWeb', e.target.value)} /></Field>
          <Field label="Directeur (signataire)"><input className="input" disabled={!canEdit} value={f.directeur} onChange={(e) => set('directeur', e.target.value)} /></Field>
        </div>
        {canEdit && <button className="btn btn-primary mt-16" onClick={() => { db.put('school', f); audit('Paramètres école', f.nom); toast('Informations enregistrées'); }}>Enregistrer</button>}
      </Card>
      <div className="stack">
        <ImageSlot title="Logo de l’école" hint="Apparaît sur les bulletins, badges, reçus et l’application. PNG transparent conseillé." preview={<SchoolLogo size={80} />} onFile={(f) => upload('logo', f)} onClear={school.logo ? () => db.patch('school', 'main', { logo: undefined }) : undefined} canEdit={canEdit} />
        <ImageSlot title="Signature du directeur" hint="Photo de la signature sur fond blanc." preview={<Signature image={school.signatureDirecteur} w={160} />} onFile={(f) => upload('signatureDirecteur', f)} onClear={school.signatureDirecteur ? () => db.patch('school', 'main', { signatureDirecteur: undefined }) : undefined} canEdit={canEdit} />
        <ImageSlot title="Cachet de l’école" hint="Utilisé au dos du livret." preview={school.cachet ? <img src={school.cachet} alt="" style={{ width: 90, height: 90, objectFit: 'contain' }} /> : <Seal name={school.nom} size={90} />} onFile={(f) => upload('cachet', f)} onClear={school.cachet ? () => db.patch('school', 'main', { cachet: undefined }) : undefined} canEdit={canEdit} />
        <Card title="Fonctionnement">
          <label className="row between mb-12" style={{ gap: 12 }}>
            <span className="small"><b style={{ color: 'var(--ink)' }}>Les parents complètent l’inscription</b><br /><span className="muted">L’école fait une inscription courte ; le parent ajoute la photo, les informations et les documents depuis son compte. L’école vérifie ensuite.</span></span>
            <Toggle on={!!school.parentsCompletent} label="Les parents complètent l’inscription" onChange={(v) => { if (!canEdit) return; db.patch('school', 'main', { parentsCompletent: v }); audit('Réglage inscriptions', v ? 'Les parents complètent l’inscription' : 'L’école remplit tout'); }} />
          </label>
          <label className="row between" style={{ gap: 12 }}>
            <span className="small"><b style={{ color: 'var(--ink)' }}>Rappels « pas encore fait »</b><br /><span className="muted">De temps en temps, un rappel de ce qui reste à mettre en place.</span></span>
            <Toggle on={school.rappels?.actif ?? true} label="Rappels de mise en route" onChange={(v) => { if (!canEdit) return; db.patch('school', 'main', { rappels: { jours: school.rappels?.jours ?? 1, actif: v } }); }} />
          </label>
          {(school.rappels?.actif ?? true) && (
            <div className="row wrap mt-8" style={{ gap: 8 }}>{[[1, 'Chaque jour'], [3, 'Tous les 3 jours'], [7, 'Chaque semaine']].map(([j, l]) => <button key={j} className={`chip ${(school.rappels?.jours ?? 1) === j ? 'active' : ''}`} disabled={!canEdit} onClick={() => db.patch('school', 'main', { rappels: { actif: true, jours: j as number } })}>{l}</button>)}</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ImageSlot({ title, hint, preview, onFile, onClear, canEdit }: { title: string; hint: string; preview: React.ReactNode; onFile: (f?: File) => void; onClear?: () => void; canEdit: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="card card-pad">
      <b style={{ color: 'var(--ink)' }}>{title}</b>
      <p className="tiny muted mb-12">{hint}</p>
      <div className="row" style={{ gap: 16 }}>
        <div style={{ minWidth: 100, minHeight: 80, display: 'grid', placeItems: 'center', background: 'var(--bg)', borderRadius: 10, padding: 8 }}>{preview}</div>
        {canEdit && <div className="stack" style={{ gap: 8 }}><button className="btn btn-sm" onClick={() => input.current?.click()}><Upload size={14} />Importer</button>{onClear && <button className="btn btn-sm btn-ghost" onClick={onClear}>Par défaut</button>}</div>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}

function YearTab() {
  const canEdit = useCanEdit();
  const school = useDoc('school', 'main')!;
  const years = useCollection('years').slice().sort((a, b) => b.libelle.localeCompare(a.libelle));
  const periods = useCollection('periods').filter((p) => p.anneeId === school.anneeCourante).sort((a, b) => a.ordre - b.ordre);
  const [newYear, setNewYear] = useState(false);
  const addPeriod = () => {
    const n = periods.length + 1;
    db.put('periods', { anneeId: school.anneeCourante, ordre: n, libelle: `${n === 1 ? '1er' : `${n}e`} contrôle`, court: `C${n}`, debut: '', fin: '', verrouillee: false, type: 'controle' } as Omit<Period, 'id' | 'updatedAt'>);
  };
  return (
    <div className="split">
      <Card title="Années scolaires" actions={canEdit && <button className="btn btn-sm btn-soft" onClick={() => setNewYear(true)}><Plus size={14} />Nouvelle année</button>}>
        <div className="stack" style={{ gap: 8 }}>
          {years.map((y) => (
            <div key={y.id} className="file-tile">
              <span className="grow"><b style={{ color: 'var(--ink)' }}>{y.libelle}</b><br /><span className="tiny muted">{y.debut} → {y.fin}</span></span>
              {y.id === school.anneeCourante ? <Badge tone="green"><Check />Année en cours</Badge> : canEdit && <button className="btn btn-sm" onClick={() => { db.patch('school', 'main', { anneeCourante: y.id }); toast(`Année ${y.libelle} activée`); }}>Activer</button>}
            </div>
          ))}
        </div>
        <p className="tiny muted mt-12">Changer d’année n’efface rien : les données des années précédentes restent consultables. Utilisez « Inscriptions → Réinscription annuelle » pour faire passer les élèves.</p>
      </Card>
      <Card title="Périodes d’évaluation (contrôles)" actions={canEdit && <button className="btn btn-sm btn-soft" onClick={addPeriod}><Plus size={14} />Ajouter</button>}>
        <div className="table-wrap"><table className="t t-compact">
          <thead><tr><th>Libellé</th><th>Court</th><th>Type</th><th>Début</th><th>Fin</th></tr></thead>
          <tbody>{periods.map((p) => (
            <tr key={p.id}>
              <td><input className="input" disabled={!canEdit} value={p.libelle} onChange={(e) => db.patch('periods', p.id, { libelle: e.target.value })} /></td>
              <td><input className="input" style={{ width: 60 }} disabled={!canEdit} value={p.court} onChange={(e) => db.patch('periods', p.id, { court: e.target.value })} /></td>
              <td><select className="select" disabled={!canEdit} value={p.type} onChange={(e) => db.patch('periods', p.id, { type: e.target.value as Period['type'] })}><option value="controle">Contrôle</option><option value="examen">Examen</option></select></td>
              <td><input type="date" className="input" disabled={!canEdit} value={p.debut} onChange={(e) => db.patch('periods', p.id, { debut: e.target.value })} /></td>
              <td><input type="date" className="input" disabled={!canEdit} value={p.fin} onChange={(e) => db.patch('periods', p.id, { fin: e.target.value })} /></td>
            </tr>
          ))}</tbody>
        </table></div>
        <p className="tiny muted mt-12">Système haïtien courant : 5 contrôles (étapes). Certaines écoles utilisent 3 trimestres : renommez simplement les périodes.</p>
      </Card>
      {newYear && <NewYear onClose={() => setNewYear(false)} />}
    </div>
  );
}

function NewYear({ onClose }: { onClose: () => void }) {
  const y = new Date().getFullYear();
  const [f, setF] = useState({ libelle: `${y} - ${y + 1}`, debut: `${y}-09-01`, fin: `${y + 1}-06-30`, copy: true });
  return (
    <Modal open onClose={onClose} title="Nouvelle année scolaire" footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={() => {
      const year = db.put('years', { libelle: f.libelle, debut: f.debut, fin: f.fin, active: true });
      const school = db.get('school', 'main')!;
      if (f.copy) db.bulkPut('periods', db.list('periods').filter((p) => p.anneeId === school.anneeCourante).map((p) => ({ ...p, id: `${year.id}-${p.court}`, anneeId: year.id, verrouillee: false, debut: '', fin: '' })));
      toast('Année créée — activez-la quand vous êtes prêt'); onClose();
    }}>Créer</button></>}>
      <div className="form-grid">
        <Field label="Libellé" className="span-2"><input className="input" value={f.libelle} onChange={(e) => setF({ ...f, libelle: e.target.value })} /></Field>
        <Field label="Début"><input type="date" className="input" value={f.debut} onChange={(e) => setF({ ...f, debut: e.target.value })} /></Field>
        <Field label="Fin"><input type="date" className="input" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></Field>
        <label className="check span-2"><input type="checkbox" checked={f.copy} onChange={(e) => setF({ ...f, copy: e.target.checked })} />Reprendre les mêmes périodes</label>
      </div>
    </Modal>
  );
}

function SubjectsTab() {
  const canEdit = useCanEdit();
  const school = useDoc('school', 'main')!;
  const subjects = useCollection('subjects');
  const [add, setAdd] = useState(false);
  const [nom, setNom] = useState('');
  const COLORS = ['blue', 'green', 'pink', 'violet', 'amber', 'cyan', 'teal', 'slate'];
  return (
    <div className="split">
      <div className="stack">
      <Card title="Barème et règles">
        <div className="form-grid">
          <Field label="Note maximale par défaut"><select className="select" disabled={!canEdit} value={school.bareme} onChange={(e) => db.patch('school', 'main', { bareme: Number(e.target.value) as 20 | 100, seuilReussite: Number(e.target.value) === 100 ? 50 : 10 })}><option value={20}>Sur 20</option><option value={100}>Sur 100</option></select></Field>
          <Field label="Moyenne de passage"><input type="number" className="input" disabled={!canEdit} value={school.seuilReussite} onChange={(e) => db.patch('school', 'main', { seuilReussite: Number(e.target.value) })} /></Field>
          <Field label="Monnaie"><input className="input" disabled={!canEdit} value={school.monnaie} onChange={(e) => db.patch('school', 'main', { monnaie: e.target.value })} /></Field>
        </div>
        <p className="tiny muted mt-12">Les moyennes sont pondérées par les coefficients de chaque classe (Classes → Matières & professeurs). Règle de décision : moyenne ≥ seuil → admis ; seuil − 1 → admis sous condition ; sinon redouble.</p>
      </Card>
      <Card title="Enseignants et alertes aux parents">
        <div className="form-grid">
          <Field label="Charge maximale d’un enseignant (h / semaine)"><input type="number" min={5} max={60} className="input" disabled={!canEdit} value={school.chargeMaxHeures ?? 30} onChange={(e) => db.patch('school', 'main', { chargeMaxHeures: Math.max(5, Number(e.target.value)) })} /></Field>
          <Field label="Prévenir le parent des retards"><select className="select" disabled={!canEdit} value={school.seuilRetards ?? 1} onChange={(e) => db.patch('school', 'main', { seuilRetards: Number(e.target.value) })}>
            <option value={1}>À chaque retard</option><option value={2}>À partir de 2 retards en 7 jours</option><option value={3}>À partir de 3 retards en 7 jours</option><option value={5}>À partir de 5 retards en 7 jours</option>
          </select></Field>
        </div>
        <div className="stack mt-12" style={{ gap: 10 }}>
          <label className="row between"><span className="small">Prévenir le parent à chaque absence</span><Toggle on={school.alerteAbsence ?? true} onChange={(v) => canEdit && db.patch('school', 'main', { alerteAbsence: v })} label="Alerte absence" /></label>
          <label className="row between"><span className="small">Prévenir le parent à chaque incident ou félicitation</span><Toggle on={school.alerteConduite ?? true} onChange={(v) => canEdit && db.patch('school', 'main', { alerteConduite: v })} label="Alerte conduite" /></label>
        </div>
        <p className="tiny muted mt-12">La charge sert à signaler les enseignants surchargés dans Classe → Équipe & matières.</p>
      </Card>
      <Card title="Taux horaires des enseignants (G / heure)" pad={false}>
        <div className="team-list">
          <div className="team-row tiny muted" style={{ paddingTop: 8, paddingBottom: 8 }}><span>Matière</span><span>Fondamental</span><span>Secondaire</span></div>
          {subjects.filter((x) => x.groupe !== 'prescolaire').map((x) => (
            <div key={x.id} className="team-row rate-row">
              <span className="small" style={{ color: 'var(--ink)' }}>{x.nom.split(' (')[0]}</span>
              {(['Fondamental', 'Secondaire'] as const).map((niv) => {
                const cur = school.tauxHoraires?.find((t) => t.matiereId === x.id && t.niveau === niv)?.taux;
                return <input key={niv} type="number" min={0} step={25} className="input" aria-label={`Taux ${x.nom} ${niv}`} disabled={!canEdit} value={cur ?? ''} placeholder="—"
                  onChange={(e) => { const rest = (school.tauxHoraires ?? []).filter((t) => !(t.matiereId === x.id && t.niveau === niv)); const v = Number(e.target.value); db.patch('school', 'main', { tauxHoraires: e.target.value === '' ? rest : [...rest, { matiereId: x.id, niveau: niv, taux: v }] }); }} />;
              })}
            </div>
          ))}
        </div>
        <p className="tiny muted card-pad">Chaque professeur voit ces taux dans son espace (Finance → Taux par matière).</p>
      </Card>
      </div>
      <Card title="Matières" actions={canEdit && <button className="btn btn-sm btn-soft" onClick={() => setAdd(true)}><Plus size={14} />Ajouter</button>}>
        <div className="stack" style={{ gap: 6 }}>
          {subjects.map((s) => (
            <div key={s.id} className="row">
              <i className={`c-${s.couleur}`} style={{ width: 14, height: 14, borderRadius: 4, flex: 'none' }} />
              <input className="input grow" disabled={!canEdit} value={s.nom} onChange={(e) => db.patch('subjects', s.id, { nom: e.target.value })} />
              <input className="input" style={{ width: 70 }} disabled={!canEdit} value={s.court} onChange={(e) => db.patch('subjects', s.id, { court: e.target.value })} />
              <select className="select" style={{ width: 100 }} disabled={!canEdit} value={s.couleur} onChange={(e) => db.patch('subjects', s.id, { couleur: e.target.value })}>{COLORS.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
          ))}
        </div>
      </Card>
      <Modal open={add} onClose={() => setAdd(false)} title="Nouvelle matière" footer={<><button className="btn" onClick={() => setAdd(false)}>Annuler</button><button className="btn btn-primary" onClick={() => { if (!nom) return; db.put('subjects', { nom, court: nom.slice(0, 3).toUpperCase(), couleur: 'slate' } as Omit<Subject, 'id' | 'updatedAt'>); setNom(''); setAdd(false); toast('Matière ajoutée — affectez-la aux classes'); }}>Ajouter</button></>}>
        <Field label="Nom"><input className="input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Espagnol" /></Field>
      </Modal>
    </div>
  );
}

function UsersTab() {
  const session = useSession()!;
  const canEdit = session.can('utilisateurs', 'write');
  const all = useCollection('users');
  const users = all.filter((u) => u.roleId).sort((a, b) => a.roleId.localeCompare(b.roleId));
  const requests = all.filter((u) => !u.roleId && u.demande && !u.demande.refusee).sort((a, b) => b.demande!.le - a.demande!.le);
  const roles = useCollection('roles');
  const staff = useCollection('staff');
  const school = useDoc('school', 'main');
  const [edit, setEdit] = useState<Partial<User> | null>(null);
  const [pick, setPick] = useState<Record<string, { roleId: string; staffId?: string }>>({});
  return (
    <>
      <div className="card card-pad mb-16">
        <div className="row wrap" style={{ gap: 12 }}>
          <span className="grow"><b style={{ color: 'var(--ink)' }}>Code d’établissement</b><div className="small muted">Donnez-le aux professeurs et au personnel : après avoir créé leur compte (Google ou e-mail), ils l’entrent pour demander l’accès. Vous validez ensuite ici.</div></span>
          <code className="school-code">{school?.codeEtablissement ?? '—'}</code>
          {canEdit && <button className="btn btn-sm" onClick={() => { if (!window.confirm('Créer un nouveau code ? L’ancien ne marchera plus.')) return; db.patch('school', 'main', { codeEtablissement: newSchoolCode(school?.nom) }); audit('Nouveau code d’établissement', '', { domaine: 'acces' }); toast('Nouveau code créé'); }}>Changer</button>}
        </div>
      </div>
      {requests.length > 0 && (
        <Card title={`Demandes d’accès (${requests.length})`} className="mb-16" pad={false}>
          {requests.map((u) => {
            const p = pick[u.id] ?? { roleId: 'r-prof', staffId: staff.find((x) => x.email?.toLowerCase() === u.email.toLowerCase())?.id };
            return (
              <div key={u.id} className="list-item" style={{ flexWrap: 'wrap', gap: 12 }}>
                <Avatar src={u.photo} name={u.nom} size={40} />
                <span className="grow" style={{ minWidth: 160 }}><b style={{ color: 'var(--ink)' }}>{u.nom}</b><div className="small muted">{u.email} · {timeAgo(u.demande!.le)}</div></span>
                {canEdit && <>
                  <select className="select" style={{ width: 150 }} value={p.roleId} onChange={(e) => setPick({ ...pick, [u.id]: { ...p, roleId: e.target.value } })}>{roles.filter((r) => r.espace !== 'parent').map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}</select>
                  <select className="select" style={{ width: 190 }} value={p.staffId ?? ''} onChange={(e) => setPick({ ...pick, [u.id]: { ...p, staffId: e.target.value || undefined } })}><option value="">Fiche du personnel…</option>{staff.filter((x) => x.statut === 'Actif').map((x) => <option key={x.id} value={x.id}>{civ(x)} · {x.poste}</option>)}</select>
                  <button className="btn btn-sm btn-primary" onClick={() => { if (roles.find((r) => r.id === p.roleId)?.espace === 'professeur' && !p.staffId) return toast('Choisissez sa fiche du personnel', true); approveRequest(u.id, p.roleId, p.staffId); toast('Accès accordé'); }}>Accepter</button>
                  <button className="btn btn-sm" onClick={() => { refuseRequest(u.id, window.prompt('Motif du refus (facultatif)') ?? undefined); toast('Demande refusée'); }}>Refuser</button>
                </>}
              </div>
            );
          })}
        </Card>
      )}
      <div className="row mb-16"><p className="small muted grow">Chaque compte a un rôle : il définit les menus visibles et ce que la personne peut modifier. On se connecte avec Google ou avec son e-mail et son mot de passe.</p>{canEdit && <button className="btn btn-primary" onClick={() => setEdit({ actif: true, roleId: 'r-sec', pin: '' })}><Plus />Nouvel utilisateur</button>}</div>
      <div className="card"><div className="table-wrap"><table className="t">
        <thead><tr><th>Utilisateur</th><th>Rôle</th><th className="only-desktop">Dernier accès</th><th>Actif</th><th /></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u.id}>
            <td><div className="person"><Avatar src={u.photo} name={u.nom} size={32} /><div><b>{u.nom}</b><div className="sub">{u.email}</div></div></div></td>
            <td>{canEdit && u.id !== session.user.id ? <select className="select" style={{ width: 170 }} value={u.roleId} onChange={(e) => { db.patch('users', u.id, { roleId: e.target.value }); audit('Changement de rôle', `${u.nom} → ${roles.find((r) => r.id === e.target.value)?.nom}`); toast('Rôle mis à jour'); }}>{roles.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}</select> : <Badge tone="blue">{roles.find((r) => r.id === u.roleId)?.nom}</Badge>}</td>
            <td className="only-desktop small muted">{u.dernierAcces ? timeAgo(u.dernierAcces) : 'Jamais'}</td>
            <td><Toggle on={u.actif} label="Actif" onChange={(v) => { if (!canEdit || u.id === session.user.id) return; db.patch('users', u.id, { actif: v }); toast(v ? 'Compte activé' : 'Compte désactivé'); }} /></td>
            <td>{canEdit && <button className="btn btn-sm" onClick={() => setEdit(u)}><KeyRound size={14} />Modifier</button>}</td>
          </tr>
        ))}</tbody>
      </table></div></div>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'} footer={<><button className="btn" onClick={() => setEdit(null)}>Annuler</button><button className="btn btn-primary" onClick={() => {
          if (!edit.nom || !edit.roleId) return toast('Nom et rôle requis', true);
          if (!/^\S+@\S+\.\S+$/.test(edit.email ?? '')) return toast('Adresse e-mail requise : c’est avec elle que la personne se connecte', true);
          const other = findByEmail(edit.email!);
          if (other && other.id !== edit.id) return toast(`Cette adresse est déjà utilisée par ${other.nom}`, true);
          putAccount({ pin: '', ...edit, email: edit.email! } as User);
          audit(edit.id ? 'Modification utilisateur' : 'Création utilisateur', edit.nom);
          toast('Utilisateur enregistré'); setEdit(null);
        }}>Enregistrer</button></>}>
          <div className="form-grid">
            <Field label="Lier à un membre du personnel" className="span-2"><select className="select" value={edit.staffId ?? ''} onChange={(e) => { const s = staff.find((x) => x.id === e.target.value); setEdit({ ...edit, staffId: s?.id, nom: s ? civ(s) : edit.nom, email: s?.email ?? edit.email, photo: s?.photo }); }}><option value="">— Aucun —</option>{staff.map((s) => <option key={s.id} value={s.id}>{civ(s)} · {s.poste}</option>)}</select></Field>
            <Field label="Nom affiché"><input className="input" value={edit.nom ?? ''} onChange={(e) => setEdit({ ...edit, nom: e.target.value })} /></Field>
            <Field label="Email"><input className="input" value={edit.email ?? ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="Rôle"><select className="select" value={edit.roleId} onChange={(e) => setEdit({ ...edit, roleId: e.target.value })}>{roles.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}</select></Field>
          </div>
          <p className="tiny muted mt-12">La personne se connecte avec Google si cette adresse est un compte Google, ou touche « Créer un compte » avec cette adresse pour choisir son mot de passe.</p>
          {edit.id && !googleAvailable && edit.mdp && <button className="btn btn-sm mt-8" onClick={() => { resetLocalPassword(edit.id!); db.patch('users', edit.id!, { dernierAcces: undefined }); setEdit(null); toast('La personne pourra choisir un nouveau mot de passe'); }}>Réinitialiser son mot de passe</button>}
        </Modal>
      )}
    </>
  );
}

function RolesTab() {
  const session = useSession()!;
  const canEdit = session.can('utilisateurs', 'write');
  const roles = useCollection('roles');
  const users = useCollection('users');
  const [sel, setSel] = useState(roles[1]?.id ?? roles[0]?.id);
  const [add, setAdd] = useState(false);
  const [nom, setNom] = useState('');
  const [del, setDel] = useState(false);
  const role = roles.find((r) => r.id === sel);
  const setPerm = (m: ModuleKey, a: Access) => role && db.patch('roles', role.id, { permissions: { ...role.permissions, [m]: a } });
  return (
    <div className="split" style={{ gridTemplateColumns: undefined }}>
      <Card title="Rôles" actions={canEdit && <button className="btn btn-sm btn-soft" onClick={() => setAdd(true)}><Plus size={14} />Créer un rôle</button>} pad={false}>
        <div className="list">{roles.map((r) => (
          <button key={r.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', background: r.id === sel ? 'var(--primary-50)' : '#fff', borderBottom: '1px solid var(--line-2)' }} onClick={() => setSel(r.id)}>
            <ShieldCheck size={18} color="var(--primary)" />
            <span className="grow"><b style={{ color: 'var(--ink)' }}>{r.nom}</b><br /><span className="tiny muted">{r.description}</span></span>
            <Badge tone="gray">{users.filter((u) => u.roleId === r.id).length}</Badge>
          </button>
        ))}</div>
      </Card>
      {role && (
        <Card title={`Permissions — ${role.nom}`} actions={canEdit && !role.systeme && <button className="btn btn-sm btn-danger" onClick={() => setDel(true)}><Trash2 size={14} /></button>}>
          {role.espace === 'professeur' ? <p className="small muted">Ce rôle donne accès à l’espace professeur : ses classes, la saisie des notes de ses matières, l’appel, le palmarès et son emploi du temps. Les notes sont automatiquement transmises à l’administration.</p> : role.id === 'r-dir' ? <p className="small muted">Le directeur a accès à tout. Ce rôle ne peut pas être restreint.</p> : (
            <div className="table-wrap"><table className="t t-compact">
              <thead><tr><th>Module</th><th className="c">Aucun</th><th className="c">Lecture</th><th className="c">Écriture</th></tr></thead>
              <tbody>{MODULES.map(([m, l]) => (
                <tr key={m}><td>{l}</td>{(['none', 'read', 'write'] as Access[]).map((a) => <td key={a} className="c"><input type="radio" disabled={!canEdit} name={m} checked={(role.permissions[m] ?? 'none') === a} onChange={() => setPerm(m, a)} style={{ accentColor: 'var(--primary)', width: 17, height: 17 }} /></td>)}</tr>
              ))}</tbody>
            </table></div>
          )}
        </Card>
      )}
      <Modal open={add} onClose={() => setAdd(false)} title="Créer un rôle" footer={<><button className="btn" onClick={() => setAdd(false)}>Annuler</button><button className="btn btn-primary" onClick={() => { if (!nom) return; const r = db.put('roles', { nom, description: 'Rôle personnalisé', espace: 'admin', permissions: { dashboard: 'read' } } as Omit<Role, 'id' | 'updatedAt'>); setSel(r.id); setNom(''); setAdd(false); toast('Rôle créé — cochez ses permissions'); }}>Créer</button></>}>
        <Field label="Nom du rôle"><input className="input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Surveillant, Infirmière, Caissier..." /></Field>
      </Modal>
      <Confirm open={del} onClose={() => setDel(false)} danger title="Supprimer le rôle" message={users.some((u) => u.roleId === role?.id) ? 'Des utilisateurs ont encore ce rôle : changez-leur de rôle d’abord.' : 'Ce rôle sera supprimé.'} onConfirm={() => { if (!role || users.some((u) => u.roleId === role.id)) return toast('Rôle encore utilisé', true); db.remove('roles', role.id); setSel(roles[0].id); }} />
    </div>
  );
}

function DataTab() {
  const sync = useSyncState();
  const nav = useNavigate();
  const canJournal = useSession()!.can('utilisateurs');
  const canEdit = useCanEdit();
  const input = useRef<HTMLInputElement>(null);
  const [reset, setReset] = useState(false);
  const [erase, setErase] = useState(false);
  const [, setTick] = useState(0);
  const [snaps, setSnaps] = useState<{ date: string; size: number }[]>([]);
  const [restore, setRestore] = useState<string | null>(null);
  useEffect(() => { void listSnapshots().then(setSnaps); }, []);
  useCollection('audit');
  const logs = db.list('audit').slice().sort((a, b) => b.date - a.date).slice(0, 15);
  return (
    <div className="split">
      <div className="stack">
        <Card title="Synchronisation">
          <div className="row" style={{ gap: 14 }}>
            <span className={firebaseEnabled ? 'tint-green' : 'tint-orange'} style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center' }}>{firebaseEnabled ? <Cloud /> : <CloudOff />}</span>
            <div className="grow">
              <b style={{ color: 'var(--ink)' }}>{firebaseEnabled ? `En ligne (école « ${SCHOOL_ID} »)` : 'Démonstration (sur cet appareil)'}</b>
              <div className="small muted">{firebaseEnabled ? `État : ${({ offline: 'hors ligne', syncing: 'envoi en cours', synced: 'à jour', error: 'problème', local: '' } as const)[sync.status]}${sync.lastSync ? ` · ${timeAgo(sync.lastSync)}` : ''}${sync.error ? ` · ${sync.error}` : ''}` : 'Une école fictive pour essayer. Rien n’est envoyé en ligne.'}</div>
            </div>
            {firebaseEnabled && <button className="btn btn-sm" onClick={() => pushOutbox()}>Synchroniser</button>}
          </div>
          <div className="small mt-12">Modifications en attente d’envoi : <b>{db.pendingCount()}</b></div>
          {onlineConfigured && (
            <div className="row wrap mt-12">
              {isDemo ? <button className="btn" onClick={leaveDemo}>Revenir à l’école en ligne</button> : <button className="btn" onClick={enterDemo}>Ouvrir la démonstration</button>}
              <button className="btn btn-danger" onClick={() => setErase(true)}><Trash2 />Effacer la démonstration</button>
            </div>
          )}
          {!onlineConfigured && <p className="tiny muted mt-12">Pour synchroniser professeurs et administration sur plusieurs appareils, créez un projet Firebase, copiez <code>.env.example</code> en <code>.env.local</code>, remplissez la configuration puis reconstruisez l’application. Voir le fichier <code>FIREBASE.md</code>.</p>}
        </Card>
        <Card title="Sauvegarde">
          <p className="small muted mb-12">Envoyez toutes les données hors de cet appareil (WhatsApp, Google Drive, email, clé USB) : si le téléphone est perdu, ce fichier permet de tout récupérer sur un autre appareil.{lastExport() ? ` Dernier envoi : ${timeAgo(lastExport())}.` : ' Aucun envoi pour l’instant.'}</p>
          <div className="row wrap">
            <button className="btn btn-primary" onClick={async () => { try { if (await shareBackup()) { toast('Sauvegarde envoyée'); setTick((x) => x + 1); } } catch (e) { toast((e as Error).message, true); } }}><Share2 />Envoyer la sauvegarde</button>
            <button className="btn" onClick={() => downloadBlob(`solonart-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, new Blob([db.exportJSON()], { type: 'application/json' }))}><Download />Télécharger</button>
            {canEdit && <button className="btn" onClick={() => input.current?.click()}><Upload />Importer</button>}
            {canEdit && isDemo && <button className="btn btn-danger" onClick={() => setReset(true)}><RotateCcw />Réinitialiser la démo</button>}
          </div>
          <input ref={input} type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { await db.importJSON(await f.text()); toast('Données importées'); } catch (err) { toast((err as Error).message, true); } }} />
        </Card>
        <Card title="Copies automatiques sur cet appareil">
          <p className="small muted mb-12">Une copie est faite chaque jour ; les 5 dernières sont gardées. Utile pour revenir en arrière après une erreur (elles disparaissent si l’appareil est perdu).</p>
          {snaps.length === 0 ? <p className="small muted">La première copie sera faite dans quelques secondes.</p> : (
            <div className="list">{snaps.map((x) => (
              <div key={x.date} className="list-item"><span className="grow">{dateLong(x.date)}<br /><span className="tiny muted">{(x.size / 1048576).toFixed(1)} Mo</span></span>
                {canEdit && <button className="btn btn-sm" onClick={() => setRestore(x.date)}><RotateCcw size={14} />Restaurer</button>}</div>
            ))}</div>
          )}
        </Card>
      </div>
      <Card title="Journal d’activité" pad={false} link={canJournal ? 'Tout voir' : undefined} onLink={() => nav('/journal')}>
        <div className="list" style={{ maxHeight: 520, overflow: 'auto' }}>{logs.map((l) => (
          <div key={l.id} className="list-item"><div className="grow"><b style={{ color: 'var(--ink)', fontWeight: 600 }}>{l.action}</b><div className="tiny muted">{l.detail}</div></div><span className="tiny muted" style={{ textAlign: 'right' }}>{db.get('users', l.userId)?.nom ?? ''}<br />{timeAgo(l.date)}</span></div>
        ))}</div>
      </Card>
      <Confirm open={!!restore} onClose={() => setRestore(null)} danger title="Restaurer une copie" confirmLabel="Restaurer" message={`Toutes les données de cet appareil seront remplacées par la copie du ${restore ? dateLong(restore) : ''}. Les modifications faites depuis seront perdues.`} onConfirm={async () => { if (!restore) return; try { await restoreSnapshot(restore); audit('Restauration copie', restore, { domaine: 'autre' }); toast('Copie restaurée'); } catch (e) { toast((e as Error).message, true); } }} />
      <Confirm open={erase} onClose={() => setErase(false)} danger title="Effacer la démonstration" confirmLabel="Effacer" message="L’école fictive est supprimée de ce téléphone. Les données de votre vraie école ne sont pas touchées. Vous pourrez rouvrir une démonstration neuve depuis l’écran de connexion." onConfirm={async () => { if (isDemo) { await db.reset(); await eraseDemo(); leaveDemo(); } else { await eraseDemo(); toast('Démonstration effacée de ce téléphone'); } }} />
      <Confirm open={reset} onClose={() => setReset(false)} danger title="Réinitialiser la démonstration" confirmLabel="Réinitialiser" message="Toutes les données de cet appareil seront remplacées par les données de démonstration." onConfirm={async () => { await db.reset(); location.reload(); }} />
    </div>
  );
}
