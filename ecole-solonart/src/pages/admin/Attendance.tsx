import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Circle, UserCheck, UserX, Clock, Percent, LogIn, LogOut } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import type { StaffAttendance } from '../../data/types';
import { PageHead, Tabs, Field, Card, StatCard, Avatar, StatusBadge, toast } from '../../components/ui';
import { RollCall } from '../../components/RollCall';
import { BarChart } from '../../components/charts';
import { todayISO, dateFull, civ } from '../../lib/format';
import { classStudents } from '../../data/compute';
import { useSession } from '../../lib/session';

export default function AttendancePage() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<'eleves' | 'personnel' | 'stats'>((params.get('tab') as 'personnel') ?? 'eleves');
  return (
    <>
      <PageHead title="Présences & ponctualité" sub={dateFull()} />
      <Tabs tabs={[['eleves', 'Élèves'], ['personnel', 'Personnel'], ['stats', 'Statistiques']]} value={tab} onChange={setTab} />
      {tab === 'eleves' && <Students />}
      {tab === 'personnel' && <StaffAtt />}
      {tab === 'stats' && <Stats />}
    </>
  );
}

function Students() {
  const session = useSession()!;
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const attendance = useCollection('attendance');
  const [date, setDate] = useState(todayISO());
  const [classe, setClasse] = useState(classes[0]?.id ?? '');
  const day = attendance.filter((a) => a.date === date);
  const absent = day.filter((a) => a.eleveId && a.statut === 'Absent').length;
  const late = day.filter((a) => a.eleveId && a.statut === 'Retard').length;
  const done = classes.filter((c) => day.some((a) => a.classeId === c.id && !a.eleveId));
  return (
    <>
      <div className="grid g-stats mb-16">
        <StatCard tint="green" icon={<UserCheck />} value={`${done.length}/${classes.length}`} label="Appels effectués" />
        <StatCard tint="red" icon={<UserX />} value={absent} label="Absents" />
        <StatCard tint="orange" icon={<Clock />} value={late} label="Retards" />
        <StatCard tint="blue" icon={<Percent />} value={`${Math.round((1 - absent / Math.max(1, done.reduce((a, c) => a + classStudents(c.id).length, 0))) * 100)}%`} label="Présence du jour" />
      </div>
      <div className="split split-side">
        <div>
          <div className="form-grid mb-16">
            <Field label="Classe"><select className="select" value={classe} onChange={(e) => setClasse(e.target.value)}>{classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Field>
            <Field label="Date"><input type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></Field>
          </div>
          <RollCall classeId={classe} date={date} readOnly={!session.can('presences', 'write')} />
        </div>
        <Card title="Appels du jour" pad={false}>
          <div className="list">{classes.map((c) => {
            const ok = done.includes(c);
            const abs = day.filter((a) => a.classeId === c.id && a.eleveId && a.statut === 'Absent').length;
            return (
              <button key={c.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)', background: c.id === classe ? 'var(--primary-50)' : '#fff' }} onClick={() => setClasse(c.id)}>
                {ok ? <CheckCircle2 size={18} color="var(--green)" /> : <Circle size={18} color="var(--faint)" />}
                <span className="grow" style={{ fontWeight: 500, color: 'var(--ink)' }}>{c.code}</span>
                {ok ? <span className="small muted">{abs} absent(s)</span> : <span className="small" style={{ color: 'var(--orange)' }}>En attente</span>}
              </button>
            );
          })}</div>
        </Card>
      </div>
    </>
  );
}

function StaffAtt() {
  const session = useSession()!;
  const canWrite = session.can('presences', 'write');
  const staff = useCollection('staff').filter((s) => s.statut === 'Actif');
  const records = useCollection('staffAttendance');
  const [date, setDate] = useState(todayISO());
  const day = new Map(records.filter((r) => r.date === date).map((r) => [r.staffId, r]));
  const now = () => new Date().toTimeString().slice(0, 5);
  const mark = (staffId: string, patch: Partial<StaffAttendance>) => {
    const cur = day.get(staffId);
    db.put('staffAttendance', { id: `sa-${date}-${staffId}`, date, staffId, statut: 'Présent', ...cur, ...patch } as StaffAttendance);
  };
  return (
    <>
      <div className="row wrap mb-16" style={{ gap: 12, alignItems: 'flex-end' }}>
        <Field label="Date"><input type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></Field>
        <span className="small muted">Pointage : arrivée avant 7h00 = à l’heure. {day.size}/{staff.length} pointés.</span>
      </div>
      <div className="card"><div className="table-wrap"><table className="t">
        <thead><tr><th>Membre</th><th className="only-desktop">Poste</th><th>Arrivée</th><th>Départ</th><th>Statut</th><th /></tr></thead>
        <tbody>{staff.map((s) => {
          const r = day.get(s.id);
          return (
            <tr key={s.id}>
              <td><div className="person"><Avatar src={s.photo} name={civ(s)} size={30} /><b>{civ(s)}</b></div></td>
              <td className="only-desktop muted">{s.poste}</td>
              <td>{r?.arrivee ?? '-'}</td><td>{r?.depart ?? '-'}</td>
              <td>{r ? <StatusBadge s={r.statut} /> : <span className="badge b-gray">Non pointé</span>}</td>
              <td>{canWrite && <div className="row" style={{ gap: 6 }}>
                {!r?.arrivee && <button className="btn btn-sm btn-soft" onClick={() => { const t = now(); mark(s.id, { arrivee: t, statut: t > '07:00' ? 'Retard' : 'Présent' }); toast(`Arrivée de ${s.prenom} à ${t}`); }}><LogIn size={14} />Arrivée</button>}
                {r?.arrivee && !r.depart && <button className="btn btn-sm" onClick={() => mark(s.id, { depart: now() })}><LogOut size={14} />Départ</button>}
                {!r && <button className="btn btn-sm btn-danger" onClick={() => mark(s.id, { statut: 'Absent' })}>Absent</button>}
              </div>}</td>
            </tr>
          );
        })}</tbody>
      </table></div></div>
    </>
  );
}

function Stats() {
  const classes = useCollection('classes').slice().sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const attendance = useCollection('attendance');
  const rates = useMemo(() => classes.map((c) => {
    const days = new Set(attendance.filter((a) => a.classeId === c.id && !a.eleveId).map((a) => a.date)).size;
    const abs = attendance.filter((a) => a.classeId === c.id && a.eleveId && (a.statut === 'Absent' || a.statut === 'Excusé')).length;
    const n = classStudents(c.id).length;
    return days && n ? Math.round((1 - abs / (days * n)) * 1000) / 10 : null;
  }), [classes, attendance]);
  const top = useMemo(() => {
    const m = new Map<string, number>();
    attendance.filter((a) => a.eleveId && a.statut === 'Absent').forEach((a) => m.set(a.eleveId, (m.get(a.eleveId) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, n]) => ({ s: db.get('students', id), n }));
  }, [attendance]);
  return (
    <div className="grid g-2">
      <Card title="Taux de présence par classe (%)"><BarChart labels={classes.map((c) => c.code)} series={[{ label: 'Présence', color: '#17a34a', values: rates }]} max={100} ticks={4} showValues /></Card>
      <Card title="Élèves les plus absents" pad={false}>
        <div className="list">{top.map(({ s, n }) => s && (
          <div key={s.id} className="list-item"><Avatar src={s.photo} name={`${s.prenom} ${s.nom}`} size={32} /><span className="grow">{s.prenom} {s.nom}<br /><span className="tiny muted">{db.get('classes', s.classeId)?.code}</span></span><span className="badge b-red">{n} absences</span></div>
        ))}</div>
      </Card>
    </div>
  );
}
