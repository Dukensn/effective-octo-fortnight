import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import { useSession } from '../../lib/session';
import { Empty, ScreenHead } from '../../components/ui';
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
  if (!mode) return <MyClasses />;
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <ScreenHead center title={title} onBack={() => nav('/')} />
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

/** Mes classes : cette année dans l'école, ou toutes (avec celles des autres établissements pour le secondaire). */
function MyClasses() {
  const nav = useNavigate();
  const session = useSession()!;
  const courses = useMyCourses();
  const classes = useCollection('classes');
  const subjects = useCollection('subjects');
  const agenda = useCollection('agenda').filter((a) => a.staffId === session.user.staffId);
  const me = useCollection('staff').find((s) => s.id === session.user.staffId);
  const [tab, setTab] = useState<'annee' | 'toutes'>('annee');
  const school = db.get('school', 'main')?.nom ?? '';
  const mine = [...new Set(courses.map((c) => c.classeId))].map((id) => classes.find((c) => c.id === id)!).filter(Boolean).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const ext = [...new Map(agenda.map((a) => [`${a.ecoleId}|${a.classe}`, a])).values()];
  const multi = (me?.autresEcoles?.length ?? 0) > 0;
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <ScreenHead center title="Mes classes" onBack={() => nav('/')} />
      {multi && <div className="seg mb-16"><button className={tab === 'annee' ? 'active' : ''} onClick={() => setTab('annee')}>{school || 'Cette école'}</button><button className={tab === 'toutes' ? 'active' : ''} onClick={() => setTab('toutes')}>Toutes</button></div>}
      {mine.length === 0 && <Empty title="Aucune classe assignée">Demandez à la direction de vous affecter des matières.</Empty>}
      <div className="stack" style={{ gap: 10 }}>
        {mine.map((c, i) => {
          const cs = courses.filter((x) => x.classeId === c.id);
          return (
            <button key={c.id} className="card list-item" style={{ borderRadius: 14, width: '100%', textAlign: 'left', padding: 14 }} onClick={() => nav(`/prof/classes/${cs[0].id}`)}>
              <span className={TINTS[i % TINTS.length]} style={{ width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 800 }}>{c.code.split('-')[0]}</span>
              <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 15 }}>{c.code}</b><br /><span className="small muted">{classStudents(c.id).length} élèves · {school}</span><br /><span className="small muted">{c.annee} · {cs.map((x) => subjects.find((s) => s.id === x.matiereId)?.court).join(', ')}</span></span>
              <ChevronRight className="chev" />
            </button>
          );
        })}
        {tab === 'toutes' && ext.map((a) => (
          <div key={a.id} className="card list-item" style={{ borderRadius: 14, padding: 14 }}>
            <span className="tint-violet" style={{ width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 800 }}>{a.classe.split('-')[0]}</span>
            <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 15 }}>{a.classe}</b><br /><span className="small muted">{a.eleves ? `${a.eleves} élèves · ` : ''}{me?.autresEcoles?.find((e) => e.id === a.ecoleId)?.nom}</span><br /><span className="small muted">{a.matiere}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
