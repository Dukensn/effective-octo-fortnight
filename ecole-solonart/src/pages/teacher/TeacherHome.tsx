import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, PenSquare, Trophy, ClipboardCheck, CalendarClock, ChevronRight, FileText } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import { Avatar, Badge, Card } from '../../components/ui';
import { classStudents, gradesForEvaluation } from '../../data/compute';
import { dateFull, dateShort } from '../../lib/format';
import { useSession } from '../../lib/session';
import { canTeacherCall, replacementsOn, slotsOf, slotsOnDay, teachesCourse } from '../../lib/regles';
import { DAYS, hourLabel } from '../admin/Timetable';

export function useMyCourses() {
  const session = useSession()!;
  const courses = useCollection('courses');
  useCollection('classes');
  return courses.filter((c) => teachesCourse(session.user.staffId, c));
}

export default function TeacherHome() {
  const nav = useNavigate();
  const session = useSession()!;
  const me = useDoc('staff', session.user.staffId);
  const school = useDoc('school', 'main');
  const courses = useMyCourses();
  const classes = useCollection('classes');
  const subjects = useCollection('subjects');
  const evaluations = useCollection('evaluations');
  useCollection('remplacements');
  const myReps = replacementsOn().filter((r) => r.remplacantId === session.user.staffId);
  const slots = slotsOf(session.user.staffId, useCollection('timetable'));
  useCollection('grades');
  const classIds = [...new Set(courses.map((c) => c.classeId))];
  const subjectIds = [...new Set(courses.map((c) => c.matiereId))];
  const myEvals = evaluations.filter((e) => courses.some((c) => c.id === e.coursId));
  const todo = myEvals.filter((e) => e.statut !== 'Clôturé' && gradesForEvaluation(e.id).size < classStudents(e.classeId).length).sort((a, b) => a.date.localeCompare(b.date));
  const d = new Date().getDay();
  const today = slots.filter((s) => s.jour === d).sort((a, b) => a.debut.localeCompare(b.debut));
  const subj = (id?: string) => subjects.find((s) => s.id === id)?.nom.split(' (')[0];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="row mb-16" style={{ gap: 14 }}>
        <Avatar src={me?.photo ?? session.user.photo} name={session.user.nom} size={60} />
        <div>
          <h2 style={{ fontSize: 20 }}>Bonjour,<br />{session.user.nom}</h2>
          <div className="small muted">{me?.poste} de {me?.specialite}</div>
        </div>
      </div>
      <div className="small muted mb-12">{dateFull()}</div>
      <div className="quote mb-16">« {school?.slogan ?? 'Former aujourd’hui, les leaders de demain.'} »</div>
      {myReps.map((r) => {
        const abs = db.get('staff', r.absentId);
        const cours = slotsOnDay(r.absentId).sort((a, b) => a.debut.localeCompare(b.debut));
        const callable = classes.filter((c) => r.classeIds.includes(c.id) && canTeacherCall(session.user.staffId, c));
        return (
          <div key={r.id} className="card card-pad mb-16" style={{ background: 'var(--orange-50)', border: 0 }}>
            <b style={{ color: 'var(--ink)' }}>Aujourd’hui, vous remplacez {abs ? `${abs.sexe === 'F' ? 'Mme' : 'M.'} ${abs.prenom} ${abs.nom}` : 'un collègue'}</b>
            <div className="small mt-4">{cours.length ? cours.map((s) => `${hourLabel(s.debut)} ${classes.find((c) => c.id === s.classeId)?.code} · ${subj(s.matiereId) ?? s.libelle ?? ''}`).join(' — ') : `Classes : ${r.classeIds.map((id) => classes.find((c) => c.id === id)?.code).join(', ')}`}</div>
            {r.note && <div className="tiny muted mt-4">{r.note}</div>}
            {callable.length > 0 && <button className="btn btn-sm btn-primary mt-8" onClick={() => nav(`/prof/appel?classe=${callable[0].id}`)}><ClipboardCheck size={14} />Faire l’appel ({callable.map((c) => c.code).join(', ')})</button>}
          </div>
        );
      })}
      <div className="tiles mb-16">
        <button className="tile" onClick={() => nav('/prof/classes')}><span className="ic"><Users /></span><b>Mes classes</b><span>{classIds.length} classes</span></button>
        <button className="tile" onClick={() => nav('/prof/cahier')}><span className="ic"><BookOpen /></span><b>Cahier de textes</b><span>{subjectIds.length} matière{subjectIds.length > 1 ? 's' : ''}</span></button>
        <button className="tile" onClick={() => nav('/prof/notes')}><span className="ic"><PenSquare /></span><b>Saisir des notes</b><span>Contrôles / Examens</span></button>
        <button className="tile" onClick={() => nav('/prof/palmares')}><span className="ic"><Trophy /></span><b>Palmarès</b><span>Voir les résultats</span></button>
      </div>
      <div className="grid g-2">
        <Card title="Prochaines évaluations" link="Voir tout" onLink={() => nav('/prof/notes')} pad={false}>
          <div className="list">
            {todo.slice(0, 5).map((e) => (
              <button key={e.id} className="list-item" style={{ border: 0, width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line-2)' }} onClick={() => nav(`/prof/evaluation/${e.id}`)}>
                <span className="tint-blue" style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center' }}><FileText size={16} /></span>
                <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 13 }}>{subj(e.matiereId)} - {classes.find((c) => c.id === e.classeId)?.code}</b><br /><span className="tiny muted">{e.titre} · {dateShort(e.date)}</span></span>
                <Badge tone="blue">{gradesForEvaluation(e.id).size}/{classStudents(e.classeId).length}</Badge>
                <ChevronRight className="chev" />
              </button>
            ))}
            {todo.length === 0 && <div className="list-item small muted">Toutes vos notes sont saisies. Bravo !</div>}
          </div>
        </Card>
        <Card title={`Mes cours aujourd’hui${d >= 1 && d <= 5 ? ` · ${DAYS[d - 1]}` : ''}`} link="Emploi du temps" onLink={() => nav('/prof/emploi')} pad={false}>
          <div className="list">
            {today.map((s) => (
              <div key={s.id} className="list-item">
                <span className="tint-green" style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center' }}><CalendarClock size={16} /></span>
                <span className="grow"><b style={{ color: 'var(--ink)', fontSize: 13 }}>{subj(s.matiereId) ?? s.libelle}</b><br /><span className="tiny muted">{hourLabel(s.debut)} - {hourLabel(s.fin)} · {classes.find((c) => c.id === s.classeId)?.code} · {s.salle}</span></span>
                {canTeacherCall(session.user.staffId, classes.find((c) => c.id === s.classeId)) && <button className="btn btn-sm btn-soft" onClick={() => nav(`/prof/appel?classe=${s.classeId}`)}><ClipboardCheck size={14} />Appel</button>}
              </div>
            ))}
            {today.length === 0 && <div className="list-item small muted">Aucun cours aujourd’hui.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
