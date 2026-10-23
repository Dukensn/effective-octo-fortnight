import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, CheckCircle2, RefreshCcw, FileSpreadsheet } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import { PageHead, Tabs, Avatar, StatusBadge, Empty, Card, Badge, toast, StatCard } from '../../components/ui';
import { fullName, dateShort } from '../../lib/format';
import { useSession, audit } from '../../lib/session';
import { Users, UserPlus, Clock, Repeat } from 'lucide-react';

export default function Enrollments() {
  const nav = useNavigate();
  const session = useSession()!;
  const students = useCollection('students');
  const classes = useCollection('classes');
  const [tab, setTab] = useState<'attente' | 'recentes' | 'reinscription'>('attente');
  const pending = students.filter((s) => s.statut === 'En attente');
  const recent = students.filter((s) => s.statut !== 'En attente').sort((a, b) => b.dateInscription.localeCompare(a.dateInscription)).slice(0, 40);
  const classOf = (id: string) => classes.find((c) => c.id === id);
  const canWrite = session.can('inscriptions', 'write');
  const actifs = students.filter((s) => s.statut === 'Actif');
  return (
    <>
      <PageHead title="Inscriptions" sub="Nouvelles inscriptions, dossiers en attente et réinscriptions."
        actions={canWrite && <><button className="btn" onClick={() => nav('/eleves/import')}><FileSpreadsheet />Importer Excel</button><button className="btn" onClick={() => nav('/inscriptions/nouvelle')}>Formulaire complet</button><button className="btn btn-primary" onClick={() => nav('/inscriptions/rapide')}><Plus />Inscription rapide</button></>} />
      <div className="grid g-stats mb-16">
        <StatCard tint="blue" icon={<Users />} value={actifs.length} label="Élèves inscrits" />
        <StatCard tint="green" icon={<UserPlus />} value={actifs.filter((s) => s.typeInscription === 'Nouvelle inscription').length} label="Nouvelles inscriptions" />
        <StatCard tint="violet" icon={<Repeat />} value={actifs.filter((s) => s.typeInscription === 'Réinscription').length} label="Réinscriptions" />
        <StatCard tint="orange" icon={<Clock />} value={pending.length} label="Dossiers en attente" />
      </div>
      <Tabs tabs={[['attente', `En attente (${pending.length})`], ['recentes', 'Inscriptions récentes'], ['reinscription', 'Réinscription annuelle']]} value={tab} onChange={setTab} />
      {tab === 'attente' && (
        <Card pad={false}>
          {pending.length === 0 ? <Empty title="Aucun dossier en attente" /> : (
            <div className="list">
              {pending.map((s) => {
                const missing = s.documents.filter((d) => !d.fourni);
                return (
                  <div key={s.id} className="list-item">
                    <Avatar src={s.photo} name={fullName(s)} size={42} />
                    <div className="grow" style={{ cursor: 'pointer' }} onClick={() => nav(`/inscriptions/${s.id}`)}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{fullName(s)}</div>
                      <div className="tiny muted">{classOf(s.classeId)?.nom} · demande du {dateShort(s.dateInscription)}</div>
                      {missing.length > 0 && <div className="tiny" style={{ color: 'var(--orange)' }}>Manque : {missing.map((d) => d.type).join(', ')}</div>}
                    </div>
                    {canWrite && <button className="btn btn-sm btn-success" onClick={() => { db.patch('students', s.id, { statut: 'Actif' }); audit('Validation inscription', fullName(s)); toast('Inscription validée'); }}><CheckCircle2 size={15} />Valider</button>}
                    <ChevronRight className="chev" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
      {tab === 'recentes' && (
        <Card pad={false}>
          <div className="table-wrap"><table className="t">
            <thead><tr><th>Élève</th><th>Classe</th><th>Type</th><th>Date</th><th>Statut</th></tr></thead>
            <tbody>{recent.map((s) => (
              <tr key={s.id} className="clickable" onClick={() => nav(`/eleves/${s.id}`)}>
                <td><div className="person"><Avatar src={s.photo} name={fullName(s)} size={32} /><b>{fullName(s)}</b></div></td>
                <td>{classOf(s.classeId)?.code}</td><td>{s.typeInscription}</td><td>{dateShort(s.dateInscription)}</td><td><StatusBadge s={s.statut} /></td>
              </tr>))}</tbody>
          </table></div>
        </Card>
      )}
      {tab === 'reinscription' && <Reinscription />}
    </>
  );
}

/** Passage en classe supérieure en fin d'année : propose la classe suivante selon la décision. */
function Reinscription() {
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const [from, setFrom] = useState(classes[0]?.id ?? '');
  const [to, setTo] = useState(classes[1]?.id ?? '');
  const students = useCollection('students').filter((s) => s.classeId === from && s.statut === 'Actif');
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const chosen = students.filter((s) => sel[s.id] ?? true);
  return (
    <Card>
      <p className="small muted mb-16">Fin d’année : transférez en bloc les élèves admis vers leur nouvelle classe. Les élèves décochés (redoublants) restent dans leur classe actuelle.</p>
      <div className="form-grid mb-16">
        <label className="field"><span>Classe actuelle</span><select className="select" value={from} onChange={(e) => { setFrom(e.target.value); setSel({}); }}>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>
        <label className="field"><span>Nouvelle classe</span><select className="select" value={to} onChange={(e) => setTo(e.target.value)}>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></label>
      </div>
      <div className="list" style={{ border: '1px solid var(--line)', borderRadius: 12, maxHeight: 360, overflow: 'auto' }}>
        {students.map((s) => (
          <label key={s.id} className="list-item check" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={sel[s.id] ?? true} onChange={(e) => setSel({ ...sel, [s.id]: e.target.checked })} />
            <Avatar src={s.photo} name={fullName(s)} size={30} /><span className="grow">{fullName(s)}</span>{s.redoublant && <Badge tone="orange">Redoublant</Badge>}
          </label>
        ))}
      </div>
      <button className="btn btn-primary mt-16" disabled={!chosen.length || from === to} onClick={() => {
        chosen.forEach((s) => db.patch('students', s.id, { classeId: to, typeInscription: 'Réinscription', redoublant: false }));
        audit('Réinscription en bloc', `${chosen.length} élèves`);
        toast(`${chosen.length} élèves réinscrits`);
        setSel({});
      }}><RefreshCcw />Réinscrire {chosen.length} élève(s)</button>
    </Card>
  );
}
