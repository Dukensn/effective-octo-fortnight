import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Phone, Mail, MapPin, GraduationCap, IdCard, CalendarDays, Archive, KeyRound, ChevronRight, FileSpreadsheet, Users, Briefcase, Wallet, UserCheck } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import type { Staff } from '../../data/types';
import { PageHead, Tabs, Field, SearchInput, Avatar, StatusBadge, Empty, Modal, toast, useIsDesktop, StatCard, Badge } from '../../components/ui';
import { civ, fullName, norm, money, dateLong, downloadCSV, readFileAsDataURL } from '../../lib/format';
import { useSession, audit } from '../../lib/session';
import { remunerationOf } from '../../lib/paie';
import { putAccount } from '../../lib/auth';

export default function StaffPage() {
  const session = useSession()!;
  const canWrite = session.can('personnel', 'write');
  const [params, setParams] = useSearchParams();
  const staff = useCollection('staff');
  const desktop = useIsDesktop();
  const [tab, setTab] = useState<'profs' | 'personnel'>(params.get('tab') === 'personnel' ? 'personnel' : 'profs');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Partial<Staff> | null>(null);
  useEffect(() => { if (params.get('new')) { setEdit({ type: tab === 'profs' ? 'Professeur' : 'Administration', sexe: 'M', statut: 'Actif', modePaiement: 'MonCash' }); setParams({}, { replace: true }); } }, [params]); // eslint-disable-line

  const list = useMemo(() => staff.filter((s) => s.statut !== 'Archivé' && (tab === 'profs' ? s.type === 'Professeur' : s.type !== 'Professeur') && (!q || norm(`${s.prenom} ${s.nom} ${s.matricule} ${s.poste} ${s.specialite ?? ''}`).includes(norm(q)))).sort((a, b) => a.matricule.localeCompare(b.matricule)), [staff, tab, q]);
  const selected = staff.find((s) => s.id === params.get('id')) ?? (desktop ? list[0] : undefined);
  const select = (id: string) => setParams({ id }, { replace: true });
  const active = staff.filter((s) => s.statut === 'Actif');

  return (
    <>
      <PageHead title="Personnel" sub="Professeurs, direction, administration et personnel de soutien."
        actions={<>
          <button className="btn" onClick={() => downloadCSV('personnel.csv', [['Matricule', 'Nom', 'Prénom', 'Poste', 'Spécialité', 'Téléphone', 'Email', 'Salaire', 'Statut'], ...list.map((s) => [s.matricule, s.nom, s.prenom, s.poste, s.specialite, s.telephone, s.email, s.salaire, s.statut])])}><FileSpreadsheet />Exporter</button>
          {canWrite && <button className="btn btn-primary" onClick={() => setEdit({ type: tab === 'profs' ? 'Professeur' : 'Administration', sexe: 'M', statut: 'Actif', modePaiement: 'MonCash', poste: tab === 'profs' ? 'Professeur' : '' })}><Plus />{tab === 'profs' ? 'Ajouter un professeur' : 'Ajouter un employé'}</button>}
        </>} />
      <div className="grid g-stats mb-16">
        <StatCard tint="blue" icon={<GraduationCap />} value={active.filter((s) => s.type === 'Professeur').length} label="Professeurs" />
        <StatCard tint="violet" icon={<Briefcase />} value={active.filter((s) => s.type === 'Direction' || s.type === 'Administration').length} label="Direction & administration" />
        <StatCard tint="green" icon={<Users />} value={active.filter((s) => s.type === 'Soutien').length} label="Personnel de soutien" />
        <StatCard tint="orange" icon={<Wallet />} value={money(active.reduce((a, s) => a + s.salaire, 0))} label="Masse salariale / mois" />
      </div>
      <Tabs tabs={[['profs', 'Professeurs'], ['personnel', 'Personnel administratif & soutien']]} value={tab} onChange={(t) => { setTab(t); setParams({}, { replace: true }); }} />
      <div className="split">
        <div className="card">
          <div className="card-pad" style={{ paddingBottom: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Nom, matricule, poste, matière..." /></div>
          {list.length === 0 ? <Empty title="Aucun membre trouvé" /> : desktop ? (
            <div className="table-wrap"><table className="t">
              <thead><tr><th>Nom</th><th>Matricule</th><th>{tab === 'profs' ? 'Matière' : 'Poste'}</th><th>Téléphone</th><th>Statut</th></tr></thead>
              <tbody>{list.map((s) => (
                <tr key={s.id} className={`clickable ${selected?.id === s.id ? 'selected' : ''}`} onClick={() => select(s.id)}>
                  <td><div className="person"><Avatar src={s.photo} name={fullName(s)} size={34} /><b>{civ(s)}</b></div></td>
                  <td>{s.matricule}</td><td>{tab === 'profs' ? s.specialite : s.poste}</td><td style={{ whiteSpace: 'nowrap' }}>{s.telephone}</td><td><StatusBadge s={s.statut} /></td>
                </tr>))}</tbody>
            </table></div>
          ) : (
            <div className="list">{list.map((s) => (
              <button key={s.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)' }} onClick={() => select(s.id)}>
                <Avatar src={s.photo} name={fullName(s)} size={42} /><div className="grow"><div style={{ fontWeight: 600, color: 'var(--ink)' }}>{civ(s)}</div><div className="tiny muted">{s.matricule} · {tab === 'profs' ? s.specialite : s.poste}</div></div><ChevronRight className="chev" />
              </button>))}</div>
          )}
        </div>
        {desktop ? selected && <StaffPanel s={selected} onEdit={() => setEdit(selected)} /> : (
          <Modal open={!!selected} onClose={() => setParams({}, { replace: true })} title="Fiche" size="lg">{selected && <StaffPanel s={selected} onEdit={() => setEdit(selected)} />}</Modal>
        )}
      </div>
      {edit && <StaffForm value={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function StaffPanel({ s, onEdit }: { s: Staff; onEdit: () => void }) {
  const nav = useNavigate();
  const session = useSession()!;
  const canWrite = session.can('personnel', 'write');
  const courses = useCollection('courses').filter((c) => c.professeurId === s.id);
  const classes = useCollection('classes');
  const subjects = useCollection('subjects');
  const users = useCollection('users');
  const salaries = useCollection('salaries').filter((x) => x.staffId === s.id).sort((a, b) => b.periode.localeCompare(a.periode));
  const user = users.find((u) => u.staffId === s.id);
  const classIds = [...new Set(courses.map((c) => c.classeId))];
  const titulaire = classes.filter((c) => c.titulaireId === s.id);
  const createAccount = () => {
    const role = s.type === 'Professeur' ? 'r-prof' : s.poste === 'Comptable' ? 'r-cpt' : s.poste.startsWith('Secrétaire') ? 'r-sec' : 'r-adj';
    putAccount({ nom: civ(s), email: s.email, telephone: s.telephone, roleId: role, staffId: s.id, pin: '', actif: true, photo: s.photo });
    audit('Création compte', civ(s));
    toast('Compte créé : la personne se connecte avec son adresse e-mail');
  };
  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="row" style={{ alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <Avatar src={s.photo} name={fullName(s)} size={96} square />
          <div className="grow" style={{ minWidth: 180 }}>
            <div className="row wrap"><h2 style={{ fontSize: 19 }}>{civ(s)}</h2><StatusBadge s={s.statut} /></div>
            <div className="small" style={{ lineHeight: 1.7, marginTop: 4 }}>Matricule : {s.matricule}<br />{s.poste}{s.specialite ? ` · ${s.specialite}` : ''}<br />{s.diplome ?? ''}</div>
          </div>
          {canWrite && <button className="btn btn-primary" onClick={onEdit}>Modifier</button>}
        </div>
        <div className="form-grid small mt-16" style={{ gap: 10 }}>
          <a className="row" href={`tel:${s.telephone}`} style={{ color: 'inherit' }}><Phone size={17} color="var(--primary)" />{s.telephone}</a>
          <a className="row" href={`mailto:${s.email}`} style={{ color: 'inherit' }}><Mail size={17} color="var(--primary)" /><span className="ellipsis">{s.email}</span></a>
          <div className="row"><MapPin size={17} color="var(--primary)" />{s.adresse}</div>
          <div className="row"><CalendarDays size={17} color="var(--primary)" />Depuis le {dateLong(s.dateEmbauche)}</div>
        </div>
      </div>
      {s.type === 'Professeur' && (
        <div className="card card-pad">
          <h3 style={{ fontSize: 16 }} className="mb-12">Matières enseignées & classes assignées</h3>
          {courses.length === 0 ? <p className="small muted">Aucune affectation. Affectez des matières depuis la fiche d’une classe.</p> : (
            <div className="stack" style={{ gap: 8 }}>
              {classIds.map((cid) => (
                <div key={cid} className="row between file-tile" onClick={() => nav(`/classes/${cid}`)}>
                  <b style={{ color: 'var(--ink)' }}>{classes.find((c) => c.id === cid)?.code}</b>
                  <span className="small muted grow">{courses.filter((c) => c.classeId === cid).map((c) => subjects.find((x) => x.id === c.matiereId)?.nom.split(' (')[0]).join(', ')}</span>
                  {titulaire.some((t) => t.id === cid) && <Badge tone="violet">Titulaire</Badge>}
                </div>
              ))}
              <div className="small muted">{courses.reduce((a, c) => a + c.heuresSemaine, 0)} heures / semaine</div>
            </div>
          )}
        </div>
      )}
      <div className="grid g-2" style={{ gap: 12 }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 15 }} className="mb-8">Contrat & salaire</h3>
          <div className="info">
            <div>Rémunération</div><div>{s.type === 'Professeur' && remunerationOf(s) === 'horaire' ? `À l’heure${s.tauxPerso ? ` · ${money(s.tauxPerso)} / h` : ' · taux des matières'}` : `Fixe · ${money(s.salaire)} / mois`}</div>
            <div>Mode de paiement</div><div>{s.modePaiement}</div>
            <div>Dernier paiement</div><div>{salaries[0] ? <StatusBadge s={salaries[0].statut} /> : '-'}</div>
            <div>NIF</div><div>{s.nif ?? '-'}</div>
          </div>
        </div>
        <div className="card card-pad">
          <h3 style={{ fontSize: 15 }} className="mb-12">Actions rapides</h3>
          <div className="qa">
            <button onClick={() => nav(`/documents/badges?type=${s.type === 'Professeur' ? 'professeur' : s.type === 'Direction' ? 'direction' : 'personnel'}&staff=${s.id}`)}><IdCard />Générer le badge</button>
            {s.type === 'Professeur' && <button onClick={() => nav(`/emploi-du-temps?prof=${s.id}`)}><CalendarDays />Emploi du temps</button>}
            <button onClick={() => nav(`/presences?tab=personnel`)}><UserCheck />Présences</button>
            {session.can('utilisateurs', 'write') && (user ? <button onClick={() => nav('/parametres?tab=utilisateurs')}><KeyRound />Compte : {user.actif ? 'actif' : 'désactivé'}</button> : <button onClick={createAccount}><KeyRound />Créer un compte d’accès</button>)}
            {canWrite && <button className="danger" onClick={() => { db.patch('staff', s.id, { statut: 'Archivé' }); toast('Membre archivé'); }}><Archive />Archiver</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StaffForm({ value, onClose }: { value: Partial<Staff>; onClose: () => void }) {
  const [f, setF] = useState<Partial<Staff>>({ salaire: 40000, dateEmbauche: new Date().toISOString().slice(0, 10), ...value });
  const set = (k: keyof Staff, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (!f.nom || !f.prenom || !f.telephone || !f.poste) return toast('Nom, prénom, poste et téléphone requis', true);
    const n = db.list('staff').length + 1;
    db.put('staff', { matricule: `EMP${String(n).padStart(3, '0')}`, adresse: '', email: '', ...f } as Staff);
    audit(value.id ? 'Modification personnel' : 'Ajout personnel', `${f.prenom} ${f.nom}`);
    toast('Enregistré');
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={value.id ? 'Modifier' : f.type === 'Professeur' ? 'Nouveau professeur' : 'Nouvel employé'} size="lg" footer={<><button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={save}>Enregistrer</button></>}>
      <div className="row mb-16">
        <Avatar src={f.photo} name={`${f.prenom ?? ''} ${f.nom ?? ''}` || '?'} size={64} square />
        <label className="btn btn-soft btn-sm">Photo<input type="file" accept="image/*" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (file) set('photo', await readFileAsDataURL(file, 400)); }} /></label>
      </div>
      <div className="form-grid">
        <Field label="Nom" req><input className="input" value={f.nom ?? ''} onChange={(e) => set('nom', e.target.value)} /></Field>
        <Field label="Prénom" req><input className="input" value={f.prenom ?? ''} onChange={(e) => set('prenom', e.target.value)} /></Field>
        <Field label="Sexe"><select className="select" value={f.sexe} onChange={(e) => set('sexe', e.target.value)}><option value="M">Masculin</option><option value="F">Féminin</option></select></Field>
        <Field label="Date de naissance"><input type="date" className="input" value={f.dateNaissance ?? ''} onChange={(e) => set('dateNaissance', e.target.value)} /></Field>
        <Field label="Catégorie"><select className="select" value={f.type} onChange={(e) => set('type', e.target.value)}>{['Professeur', 'Direction', 'Administration', 'Soutien'].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Poste" req><input className="input" list="postes" value={f.poste ?? ''} onChange={(e) => set('poste', e.target.value)} /><datalist id="postes">{['Professeur', 'Professeure', 'Directeur', 'Directrice adjointe', 'Secrétaire', 'Comptable', 'Censeur (Préfet de discipline)', 'Conseiller scolaire', 'Bibliothécaire', "Agent d'entretien", 'Gardien', 'Infirmière'].map((p) => <option key={p} value={p} />)}</datalist></Field>
        {f.type === 'Professeur' && <Field label="Spécialité / matière"><input className="input" value={f.specialite ?? ''} onChange={(e) => set('specialite', e.target.value)} /></Field>}
        <Field label="Diplôme" opt><input className="input" value={f.diplome ?? ''} onChange={(e) => set('diplome', e.target.value)} /></Field>
        <Field label="Téléphone" req><input className="input" type="tel" value={f.telephone ?? ''} onChange={(e) => set('telephone', e.target.value)} placeholder="+509" /></Field>
        <Field label="Email"><input className="input" type="email" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Adresse" className="span-2"><input className="input" value={f.adresse ?? ''} onChange={(e) => set('adresse', e.target.value)} /></Field>
        <Field label="Date d’embauche"><input type="date" className="input" value={f.dateEmbauche ?? ''} onChange={(e) => set('dateEmbauche', e.target.value)} /></Field>
        {f.type === 'Professeur' && (
          <Field label="Rémunération" className="span-2">
            <div className="seg">
              <button type="button" className={remunerationOf(f as Staff) === 'fixe' ? 'active' : ''} onClick={() => set('remuneration', 'fixe')}>Salaire fixe</button>
              <button type="button" className={remunerationOf(f as Staff) === 'horaire' ? 'active' : ''} onClick={() => set('remuneration', 'horaire')}>À l’heure</button>
            </div>
            <span className="tiny muted">{remunerationOf(f as Staff) === 'horaire' ? 'Payé selon les cours validés dans le mois × taux de la matière (Paramètres → Matières & règles).' : 'Même montant chaque mois.'}{!f.remuneration ? ' Choix par défaut selon le niveau enseigné.' : ''}</span>
          </Field>
        )}
        {f.type === 'Professeur' && remunerationOf(f as Staff) === 'horaire'
          ? <Field label="Taux horaire propre (G / h)" opt><input type="number" className="input" value={f.tauxPerso ?? ''} placeholder="Taux de la matière" onChange={(e) => set('tauxPerso', e.target.value === '' ? undefined : Number(e.target.value))} /></Field>
          : <Field label="Salaire mensuel (G)"><input type="number" className="input" value={f.salaire} onChange={(e) => set('salaire', Number(e.target.value))} /></Field>}
        <Field label="Mode de paiement"><select className="select" value={f.modePaiement} onChange={(e) => set('modePaiement', e.target.value)}>{['MonCash', 'NatCash', 'Espèces', 'Virement', 'Chèque'].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="NIF" opt><input className="input" value={f.nif ?? ''} onChange={(e) => set('nif', e.target.value)} /></Field>
        <Field label="Statut"><select className="select" value={f.statut} onChange={(e) => set('statut', e.target.value)}>{['Actif', 'Congé', 'Inactif'].map((t) => <option key={t}>{t}</option>)}</select></Field>
      </div>
    </Modal>
  );
}

