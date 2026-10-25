import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCollection } from '../../data/store';
import type { Lesson } from '../../data/types';
import { Empty, PageHead } from '../../components/ui';
import { LessonForm } from '../../components/LessonForm';
import { LessonList } from '../admin/Cahier';
import { useSession } from '../../lib/session';
import { teachesCourse } from '../../lib/regles';

/** Cahier de textes du professeur : ses cours, ses séances, ses devoirs. */
export default function TeacherCahier() {
  const session = useSession()!;
  const courses = useCollection('courses').filter((c) => teachesCourse(session.user.staffId, c));
  const classes = useCollection('classes');
  const subjects = useCollection('subjects');
  const lessons = useCollection('lessons');
  const [params] = useSearchParams();
  const [coursId, setCoursId] = useState(params.get('cours') ?? courses[0]?.id ?? '');
  const [form, setForm] = useState<Partial<Lesson> | null>(null);
  const label = (id: string) => { const c = courses.find((x) => x.id === id); return c ? `${classes.find((k) => k.id === c.classeId)?.code} · ${subjects.find((s) => s.id === c.matiereId)?.court}` : ''; };
  if (!courses.length) return <Empty title="Aucun cours">La direction ne vous a pas encore affecté de cours.</Empty>;
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <PageHead title="Cahier de textes" sub="Notez ce que vous avez fait en classe et les devoirs donnés." actions={<button className="btn btn-primary" onClick={() => setForm({ coursId })}><Plus />Nouvelle séance</button>} />
      <div className="row wrap mb-16" style={{ gap: 8 }}>
        {courses.map((c) => <button key={c.id} className={`chip ${coursId === c.id ? 'active' : ''}`} onClick={() => setCoursId(c.id)}>{label(c.id)}</button>)}
      </div>
      <LessonList lessons={lessons.filter((l) => l.coursId === coursId)} onOpen={(l) => setForm(l)} />
      <div className="sticky-foot only-phone-flex"><button className="btn btn-primary btn-lg btn-block" onClick={() => setForm({ coursId })}><Plus />Nouvelle séance</button></div>
      {form && <LessonForm value={form} courses={courses} onClose={() => setForm(null)} />}
    </div>
  );
}
