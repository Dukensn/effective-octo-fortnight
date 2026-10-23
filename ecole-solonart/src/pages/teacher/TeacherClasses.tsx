import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import { useCollection } from '../../data/store';
import { Empty } from '../../components/ui';
import { classStudents } from '../../data/compute';
import { useMyCourses } from './TeacherHome';

const TINTS = ['tint-blue', 'tint-green', 'tint-violet', 'tint-orange'];

export default function TeacherClasses({ mode }: { mode?: 'notes' | 'palmares' }) {
  const nav = useNavigate();
  const courses = useMyCourses();
  const classes = useCollection('classes');
  const subjects = useCollection('subjects');
  const sorted = [...courses].sort((a, b) => (classes.find((c) => c.id === a.classeId)?.code ?? '').localeCompare(classes.find((c) => c.id === b.classeId)?.code ?? '', 'fr', { numeric: true }));
  const title = mode === 'notes' ? 'Saisir des notes' : mode === 'palmares' ? 'Palmarès' : 'Mes classes';
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="row mb-16">
        <button className="icon-btn" onClick={() => nav('/')} aria-label="Retour"><ArrowLeft /></button>
        <h2 className="grow center" style={{ fontSize: 18 }}>{title}</h2>
        <span style={{ width: 40 }} />
      </div>
      {mode && <p className="small muted mb-12 center">Choisissez une classe</p>}
      {sorted.length === 0 && <Empty title="Aucune classe assignée">Demandez à la direction de vous affecter des matières.</Empty>}
      <div className="stack" style={{ gap: 10 }}>
        {sorted.map((co, i) => {
          const c = classes.find((x) => x.id === co.classeId);
          return (
            <button key={co.id} className="card list-item" style={{ borderRadius: 14, width: '100%', textAlign: 'left', padding: 16, background: i === 0 ? 'var(--primary-50)' : '#fff' }} onClick={() => nav(`/prof/classes/${co.id}`)}>
              <span className={TINTS[i % TINTS.length]} style={{ width: 42, height: 42, borderRadius: 10, display: 'grid', placeItems: 'center' }}><FileText size={20} /></span>
              <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 15 }}>{c?.code}</b><br /><span className="small muted">{classStudents(co.classeId).length} élèves</span><br /><span className="small muted">{subjects.find((s) => s.id === co.matiereId)?.nom.split(' (')[0]}</span></span>
              <ChevronRight className="chev" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
