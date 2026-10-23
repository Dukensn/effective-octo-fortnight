import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCollection } from '../../data/store';
import { Field, PageHead, Empty } from '../../components/ui';
import { RollCall } from '../../components/RollCall';
import { todayISO } from '../../lib/format';
import { useSession } from '../../lib/session';
import { canTeacherCall } from '../../lib/regles';

export default function TeacherAttendance() {
  const [params] = useSearchParams();
  const session = useSession()!;
  const classes = useCollection('classes');
  useCollection('courses');
  // Un seul appel par jour : au préscolaire et au fondamental par le(s) titulaire(s) ; au secondaire par l'administration.
  const mine = classes.filter((c) => canTeacherCall(session.user.staffId, c)).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const [classe, setClasse] = useState(params.get('classe') ?? mine[0]?.id ?? '');
  const [date, setDate] = useState(todayISO());
  if (!mine.length) return <Empty title="Pas d’appel à faire">Au secondaire, l’appel est fait par l’administration. Au préscolaire et au fondamental, il est fait par le titulaire de la classe.</Empty>;
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <PageHead title="Faire l’appel" sub="Tout le monde est présent par défaut : marquez seulement les absences et retards." />
      <div className="form-grid mb-16">
        <Field label="Classe"><select className="select" value={classe} onChange={(e) => setClasse(e.target.value)}>{mine.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></Field>
        <Field label="Date"><input type="date" className="input" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
      <RollCall classeId={classe} date={date} />
    </div>
  );
}
