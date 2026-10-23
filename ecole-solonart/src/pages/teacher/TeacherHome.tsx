import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, PenSquare, Trophy, ClipboardCheck, ChevronRight, FileText, School, Wallet, NotebookPen } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import { Avatar, Badge, Card } from '../../components/ui';
import { classStudents, gradesForEvaluation } from '../../data/compute';
import { dateFull, dateShort, todayISO } from '../../lib/format';
import { useSession } from '../../lib/session';
import { callDone, canTeacherCall, replacementsOn, slotsOnDay, teachesCourse } from '../../lib/regles';
import { canMultiSchool, dayItems } from '../../lib/prof';
import { DayCard } from './TeacherSchedule';
import { hourLabel } from '../admin/Timetable';

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
  const courses = useMyCourses();
  const classes = useCollection('classes');
  const subjects = useCollection('subjects');
  const evaluations = useCollection('evaluations');
  useCollection('remplacements'); useCollection('timetable'); useCollection('agenda'); useCollection('attendance'); useCollection('grades');
  const myReps = replacementsOn().filter((r) => r.remplacantId === session.user.staffId);
  const classIds = [...new Set(courses.map((c) => c.classeId))];
  const subjectIds = [...new Set(courses.map((c) => c.matiereId))];
  const myEvals = evaluations.filter((e) => courses.some((c) => c.id === e.coursId));
  const todo = myEvals.filter((e) => e.statut !== 'Clôturé' && gradesForEvaluation(e.id).size < classStudents(e.classeId).length).sort((a, b) => a.date.localeCompare(b.date));
  const subj = (id?: string) => subjects.find((s) => s.id === id)?.nom.split(' (')[0];
  const today = dayItems(session.user.staffId, todayISO());
  const toCall = classes.filter((c) => canTeacherCall(session.user.staffId, c) && !callDone(c.id));
  const multi = canMultiSchool(session.user.staffId);
  const ecoles = 1 + (me?.autresEcoles?.filter((e) => e.actif).length ?? 0);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="row mb-16" style={{ gap: 14 }}>
        <Avatar src={me?.photo ?? session.user.photo} name={session.user.nom} size={56} />
        <div className="grow"><div className="small muted">Bonjour</div><h2 style={{ fontSize: 20 }}>{session.user.nom}</h2><div className="small muted">{me?.poste}{me?.specialite ? ` · ${me.specialite}` : ''}</div></div>
      </div>

      <div className="card card-pad mb-16">
        <button className="row between" style={{ width: '100%', border: 0, background: 'none', padding: 0, textAlign: 'left' }} onClick={() => nav('/prof/emploi?vue=jour')}>
          <span><b style={{ color: 'var(--ink)', fontSize: 16 }}>{dateFull()}</b><div className="small muted">{today.length ? `Vous avez ${today.length} cours aujourd’hui` : 'Pas de cours aujourd’hui'}</div></span><ChevronRight className="chev" />
        </button>
        {today.length > 0 && <div className="stack mt-12" style={{ gap: 8 }}>{today.slice(0, 4).map((it) => <DayCard key={it.id} it={it} date={todayISO()} onOpen={(x) => nav(x.kind === 'externe' ? '/prof/emploi?vue=jour' : `/prof/cours/${x.slot!.id}`)} />)}</div>}
        <button className="btn btn-primary btn-block mt-12" onClick={() => nav('/prof/emploi')}>Voir mon emploi du temps<ChevronRight size={18} /></button>
      </div>

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
      {toCall.length > 0 && !myReps.length && (
        <button className="card card-pad mb-16 row" style={{ width: '100%', textAlign: 'left', background: 'var(--red-50)', border: 0, gap: 12 }} onClick={() => nav(`/prof/appel?classe=${toCall[0].id}`)}>
          <ClipboardCheck color="var(--red)" /><span className="grow"><b style={{ color: 'var(--ink)' }}>Appel à faire</b><div className="small">{toCall.map((c) => c.code).join(', ')}</div></span><ChevronRight className="chev" />
        </button>
      )}

      <div className="tiles mb-16">
        <button className="tile" onClick={() => nav('/prof/classes')}><span className="ic"><Users /></span><b>Mes classes</b><span>{classIds.length} classe{classIds.length > 1 ? 's' : ''}</span></button>
        <button className="tile" onClick={() => nav('/prof/matieres')}><span className="ic"><BookOpen /></span><b>Mes matières</b><span>{subjectIds.length} matière{subjectIds.length > 1 ? 's' : ''}</span></button>
        <button className="tile" onClick={() => nav('/prof/notes')}><span className="ic"><PenSquare /></span><b>Saisir des notes</b><span>Contrôles / Examens</span></button>
        {multi ? <button className="tile" onClick={() => nav('/prof/ecoles')}><span className="ic"><School /></span><b>Mes écoles</b><span>{ecoles} établissement{ecoles > 1 ? 's' : ''}</span></button>
          : <button className="tile" onClick={() => nav('/prof/palmares')}><span className="ic"><Trophy /></span><b>Palmarès</b><span>Voir les résultats</span></button>}
        <button className="tile" onClick={() => nav('/prof/finance')}><span className="ic"><Wallet /></span><b>Finance</b><span>Salaire, heures, reçus</span></button>
        <button className="tile" onClick={() => nav('/prof/cahier')}><span className="ic"><NotebookPen /></span><b>Cahier de textes</b><span>Séances et devoirs</span></button>
      </div>

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
    </div>
  );
}
