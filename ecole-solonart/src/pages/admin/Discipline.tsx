import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Printer, AlertTriangle, Award, ShieldAlert, Users } from 'lucide-react';
import { useCollection } from '../../data/store';
import { INCIDENT_TYPES, type Incident } from '../../data/types';
import { Avatar, Badge, Card, Empty, PageHead, Pills, SearchInput, StatCard, Tabs, usePaged, Pager } from '../../components/ui';
import { IncidentForm, incidentTone } from '../../components/IncidentForm';
import { BarChart } from '../../components/charts';
import { dateShort, fullName, norm } from '../../lib/format';
import { useSession } from '../../lib/session';
import { printDocument } from '../../lib/print';
import { DisciplineSheet } from '../../docs/Sheets';

export default function Discipline() {
  const session = useSession()!;
  const canWrite = session.can('discipline', 'write');
  const [params] = useSearchParams();
  const nav = useNavigate();
  const incidents = useCollection('incidents');
  const students = useCollection('students');
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const [tab, setTab] = useState<'registre' | 'stats'>('registre');
  const [classe, setClasse] = useState('all');
  const [type, setType] = useState('all');
  const [statut, setStatut] = useState<'Ouverts' | 'Tous'>('Tous');
  const [q, setQ] = useState('');
  // Préremplissage (assistant IA, fiche élève) : ?new=1&eleve=…&type=…&description=…
  const [form, setForm] = useState<Partial<Incident> | null>(() => {
    if (!params.get('new')) return null;
    const f: Partial<Incident> = {};
    if (params.get('eleve')) f.eleveId = params.get('eleve')!;
    if ((INCIDENT_TYPES as readonly string[]).includes(params.get('type') ?? '')) f.type = params.get('type') as Incident['type'];
    if (params.get('description')) f.description = params.get('description')!;
    return f;
  });
  const stu = (id: string) => students.find((s) => s.id === id);
  const list = useMemo(() => incidents
    .filter((i) => (classe === 'all' || (i.classeId ?? stu(i.eleveId)?.classeId) === classe) && (type === 'all' || i.type === type) && (statut === 'Tous' || i.statut === 'Ouvert'))
    .filter((i) => !q || norm(`${fullName(stu(i.eleveId))} ${i.description}`).includes(norm(q)))
    .sort((a, b) => b.date.localeCompare(a.date)), [incidents, classe, type, statut, q, students]); // eslint-disable-line
  const paged = usePaged(list, 15);
  const ouverts = incidents.filter((i) => i.statut === 'Ouvert').length;
  const graves = incidents.filter((i) => i.gravite === 'Grave').length;
  const felic = incidents.filter((i) => i.type === 'Félicitations').length;
  const code = (id?: string) => classes.find((c) => c.id === id)?.code;
  const printReg = () => printDocument(<DisciplineSheet incidents={list} title={`Registre de discipline${classe !== 'all' ? ` — ${code(classe)}` : ''}`} sub={`${list.length} inscription${list.length > 1 ? 's' : ''}${type !== 'all' ? ` · ${type}` : ''}`} />, 'A4 portrait', 'Registre de discipline');

  return (
    <>
      <PageHead title="Discipline" sub="Registre des incidents, sanctions et félicitations."
        actions={<>
          <button className="btn" onClick={printReg}><Printer />Imprimer le registre</button>
          {canWrite && <button className="btn btn-primary" onClick={() => setForm({})}><Plus />Signaler</button>}
        </>} />
      <div className="grid g-stats mini mb-16">
        <StatCard tint="orange" icon={<ShieldAlert />} value={ouverts} label="Dossiers ouverts" />
        <StatCard tint="red" icon={<AlertTriangle />} value={graves} label="Faits graves" />
        <StatCard tint="green" icon={<Award />} value={felic} label="Félicitations" />
        <StatCard tint="blue" icon={<Users />} value={new Set(incidents.filter((i) => i.type !== 'Félicitations').map((i) => i.eleveId)).size} label="Élèves concernés" />
      </div>
      <Tabs tabs={[['registre', 'Registre'], ['stats', 'Statistiques']]} value={tab} onChange={setTab} />

      {tab === 'registre' && (
        <div className="stack">
          <div className="card card-pad stack filters" style={{ gap: 10 }}>
            <select className="select" value={classe} onChange={(e) => setClasse(e.target.value)} aria-label="Classe"><option value="all">Toutes les classes</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select>
            <select className="select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type"><option value="all">Tous les types</option>{INCIDENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="row wrap" style={{ gap: 10 }}>
            <Pills items={['Tous', 'Ouverts'] as const} value={statut} onChange={setStatut} />
            <div className="grow" style={{ minWidth: 200 }}><SearchInput value={q} onChange={setQ} placeholder="Élève ou mot-clé…" /></div>
          </div>
          <Card pad={false}>
            {list.length === 0 ? <Empty title="Aucune inscription">Rien ne correspond à ces filtres.</Empty> : (
              <div className="list">
                {paged.items.map((i) => {
                  const s = stu(i.eleveId);
                  return (
                    <button key={i.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)', alignItems: 'flex-start' }} onClick={() => setForm(i)}>
                      <Avatar src={s?.photo} name={fullName(s)} size={40} />
                      <div className="grow">
                        <div className="row wrap" style={{ gap: 6 }}><b style={{ color: 'var(--ink)' }}>{fullName(s)}</b><span className="tiny muted">{code(i.classeId ?? s?.classeId)} · {dateShort(i.date)}</span></div>
                        <div className="small" style={{ marginTop: 2 }}>{i.description}</div>
                        <div className="row wrap mt-4" style={{ gap: 6 }}>
                          <Badge tone={incidentTone(i)}>{i.type}</Badge>
                          {i.sanction && <span className="tiny muted">{i.sanction}{i.joursExclusion ? ` · ${i.joursExclusion} j` : ''}</span>}
                          {i.statut === 'Ouvert' && <Badge tone="orange">Ouvert</Badge>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <Pager {...paged} perPage={15} />
          </Card>
        </div>
      )}

      {tab === 'stats' && <Stats incidents={incidents} onStudent={(id) => nav(`/eleves/${id}`)} />}
      {form && <IncidentForm value={form} onClose={() => setForm(null)} />}
    </>
  );
}

function Stats({ incidents, onStudent }: { incidents: Incident[]; onStudent: (id: string) => void }) {
  const students = useCollection('students');
  const classes = useCollection('classes').filter((c) => c.niveau !== 'Préscolaire').sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const neg = incidents.filter((i) => i.type !== 'Félicitations');
  const byType = INCIDENT_TYPES.filter((t) => t !== 'Félicitations').map((t) => [t, neg.filter((i) => i.type === t).length] as const).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...byType.map(([, n]) => n));
  const count = new Map<string, number>();
  neg.forEach((i) => count.set(i.eleveId, (count.get(i.eleveId) ?? 0) + 1));
  const recid = [...count.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return (
    <div className="grid g-2">
      <Card title="Par classe">
        <BarChart labels={classes.map((c) => c.code)} series={[{ label: 'Incidents', color: '#f08c00', values: classes.map((c) => neg.filter((i) => i.classeId === c.id).length) }]} ticks={3} showValues />
      </Card>
      <Card title="Par type">
        <div className="stack" style={{ gap: 10 }}>
          {byType.map(([t, n]) => <div key={t}><div className="row between small"><span>{t}</span><b style={{ color: 'var(--ink)' }}>{n}</b></div><div className="bar mt-4"><i style={{ width: `${(n / max) * 100}%`, background: 'var(--orange)' }} /></div></div>)}
        </div>
      </Card>
      <Card title="Élèves à suivre" pad={false}>
        {recid.length === 0 ? <Empty title="Aucun élève récidiviste" /> : (
          <div className="list">
            {recid.map(([id, n]) => {
              const s = students.find((x) => x.id === id);
              return (
                <button key={id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)' }} onClick={() => onStudent(id)}>
                  <Avatar src={s?.photo} name={fullName(s)} size={36} /><span className="grow"><b style={{ color: 'var(--ink)' }}>{fullName(s)}</b><br /><span className="tiny muted">{classes.find((c) => c.id === s?.classeId)?.code}</span></span>
                  <span className="todo-n">{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
