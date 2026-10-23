import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCollection } from '../../data/store';
import type { Incident } from '../../data/types';
import { Avatar, Badge, Card, Empty, PageHead } from '../../components/ui';
import { IncidentForm, incidentTone } from '../../components/IncidentForm';
import { dateShort, fullName } from '../../lib/format';
import { useSession } from '../../lib/session';

/** Le professeur signale un incident (ou des félicitations) pour un élève de ses classes. */
export default function TeacherDiscipline() {
  const session = useSession()!;
  const courses = useCollection('courses').filter((c) => c.professeurId === session.user.staffId);
  const classIds = new Set(courses.map((c) => c.classeId));
  const students = useCollection('students').filter((s) => classIds.has(s.classeId) && s.statut === 'Actif');
  const classes = useCollection('classes');
  const mine = useCollection('incidents').filter((i) => i.auteurId === session.user.staffId || students.some((s) => s.id === i.eleveId)).sort((a, b) => b.date.localeCompare(a.date));
  const [form, setForm] = useState<Partial<Incident> | null>(null);
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <PageHead title="Discipline" sub="Signalez un incident ou félicitez un élève de vos classes. La direction est informée." actions={<button className="btn btn-primary" onClick={() => setForm({})}><Plus />Signaler</button>} />
      <Card pad={false}>
        {mine.length === 0 ? <Empty title="Rien à signaler" /> : (
          <div className="list">
            {mine.map((i) => {
              const s = students.find((x) => x.id === i.eleveId);
              const own = i.auteurId === session.user.staffId;
              return (
                <button key={i.id} className="list-item" disabled={!own} style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)', alignItems: 'flex-start', color: 'inherit' }} onClick={() => own && setForm(i)}>
                  <Avatar src={s?.photo} name={fullName(s)} size={38} />
                  <div className="grow">
                    <div className="row wrap" style={{ gap: 6 }}><b style={{ color: 'var(--ink)' }}>{fullName(s)}</b><span className="tiny muted">{classes.find((c) => c.id === s?.classeId)?.code} · {dateShort(i.date)}</span></div>
                    <div className="small">{i.description}</div>
                    <div className="row wrap mt-4" style={{ gap: 6 }}><Badge tone={incidentTone(i)}>{i.type}</Badge>{i.sanction && <span className="tiny muted">{i.sanction}</span>}{!own && <span className="tiny muted">Signalé par un collègue</span>}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
      <div className="sticky-foot only-phone-flex"><button className="btn btn-primary btn-lg btn-block" onClick={() => setForm({})}><Plus />Signaler</button></div>
      {form && <IncidentForm value={form} students={students} onClose={() => setForm(null)} />}
    </div>
  );
}
