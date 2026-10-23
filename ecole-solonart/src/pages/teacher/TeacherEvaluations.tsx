import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useCollection, useDoc } from '../../data/store';
import { Empty, ScreenHead, StatusBadge } from '../../components/ui';
import { dateShort } from '../../lib/format';
import { useSession } from '../../lib/session';
import { teachesCourse } from '../../lib/regles';

export default function TeacherEvaluations() {
  const { coursId } = useParams();
  const nav = useNavigate();
  const session = useSession()!;
  const course = useDoc('courses', coursId);
  const classe = useDoc('classes', course?.classeId);
  const subject = useDoc('subjects', course?.matiereId);
  const periods = useCollection('periods');
  const evaluations = useCollection('evaluations').filter((e) => e.coursId === coursId);
  const [tab, setTab] = useState<'controle' | 'examen'>('controle');
  if (!course || !teachesCourse(session.user.staffId, course)) return <Empty title="Cours introuvable" />;
  const typeOf = (pid: string) => periods.find((p) => p.id === pid)?.type ?? 'controle';
  const ordre = (pid: string) => periods.find((p) => p.id === pid)?.ordre ?? 0;
  const list = evaluations.filter((e) => typeOf(e.periodeId) === tab || (tab === 'examen' && /examen/i.test(e.titre))).sort((a, b) => ordre(a.periodeId) - ordre(b.periodeId) || a.date.localeCompare(b.date));
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <ScreenHead center title={`${classe?.code} - ${subject?.nom.split(' (')[0]}`} onBack={() => nav('/prof/classes')} />
      <div className="seg mb-16"><button className={tab === 'controle' ? 'active' : ''} onClick={() => setTab('controle')}>Contrôles</button><button className={tab === 'examen' ? 'active' : ''} onClick={() => setTab('examen')}>Examens</button></div>
      {list.length === 0 && <Empty title="Aucune évaluation">La direction planifie les contrôles et examens.</Empty>}
      <div className="stack" style={{ gap: 10 }}>
        {list.map((e) => (
          <button key={e.id} className="card list-item" style={{ borderRadius: 14, width: '100%', textAlign: 'left', padding: 16, background: e.statut === 'En cours' ? 'var(--primary-50)' : '#fff' }} onClick={() => nav(`/prof/evaluation/${e.id}`)}>
            <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 15 }}>{e.titre}</b><br /><span className="small muted">Date : {dateShort(e.date)}</span></span>
            <StatusBadge s={e.statut} />
            <ChevronRight className="chev" />
          </button>
        ))}
      </div>
    </div>
  );
}
