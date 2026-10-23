import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, CalendarDays } from 'lucide-react';
import { useCollection } from '../../data/store';
import { Field, PageHead, Empty, ScreenHead } from '../../components/ui';
import { RollCall } from '../../components/RollCall';
import { classStudents } from '../../data/compute';
import { dateFull, todayISO } from '../../lib/format';
import { useSession } from '../../lib/session';
import { callDone, canTeacherCall } from '../../lib/regles';

/** Appel du professeur : les classes du jour (fait / non fait), puis la feuille d'appel. */
export default function TeacherAttendance() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const session = useSession()!;
  const classes = useCollection('classes');
  useCollection('courses'); useCollection('attendance'); useCollection('remplacements');
  // Un seul appel par jour : au préscolaire et au fondamental par le(s) titulaire(s) ; au secondaire par l'administration.
  const mine = classes.filter((c) => canTeacherCall(session.user.staffId, c)).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const [date, setDate] = useState(todayISO());
  const classe = params.get('classe');
  if (!mine.length) return <Empty title="Pas d’appel à faire">Au secondaire, l’appel est fait par l’administration. Au préscolaire et au fondamental, il est fait par le titulaire de la classe.</Empty>;
  if (!classe || !mine.some((c) => c.id === classe)) return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <PageHead title="Présences" sub="Faites l’appel rapidement : tout le monde est présent par défaut." />
      <button className="card card-pad row mb-16" style={{ width: '100%', textAlign: 'left', background: 'var(--primary)', color: '#fff', border: 0, gap: 12 }} onClick={() => setParams({ classe: (mine.find((c) => !callDone(c.id)) ?? mine[0]).id })}>
        <CalendarDays /><span className="grow"><b style={{ fontSize: 16 }}>Faire l’appel</b><div className="small" style={{ opacity: .85 }}>{mine.filter((c) => !callDone(c.id)).length ? `${mine.filter((c) => !callDone(c.id)).length} classe(s) en attente` : 'Tout est fait pour aujourd’hui'}</div></span><ChevronRight />
      </button>
      <div className="small mb-8" style={{ fontWeight: 600, color: 'var(--ink)' }}>Aujourd’hui · {dateFull()}</div>
      <div className="card">{mine.map((c) => (
        <button key={c.id} className="sheet-row" onClick={() => setParams({ classe: c.id })}>
          <span className="grow"><b>{c.code}</b><small className="muted" style={{ display: 'block', fontSize: 12 }}>{c.annee} · {classStudents(c.id).length} élèves</small></span>
          {callDone(c.id) ? <span className="badge b-green">Fait</span> : <span className="badge b-red">Non fait</span>}<ChevronRight size={18} className="chev" />
        </button>
      ))}</div>
    </div>
  );
  const c = mine.find((x) => x.id === classe)!;
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <ScreenHead title={`Présence - ${c.code}`} sub={dateFull(new Date(date + 'T12:00:00'))} onBack={() => (params.get('classe') && window.history.length > 1 ? nav(-1) : setParams({}))} />
      <div className="form-grid mb-12">
        {mine.length > 1 && <Field label="Classe"><select className="select" value={classe} onChange={(e) => setParams({ classe: e.target.value }, { replace: true })}>{mine.map((x) => <option key={x.id} value={x.id}>{x.code}</option>)}</select></Field>}
        <Field label="Date"><input type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
      <RollCall classeId={c.id} date={date} />
    </div>
  );
}
