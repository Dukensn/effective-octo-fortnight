// Accueil du professeur, pensé comme une application mobile :
// 1. ce qui compte maintenant (cours en cours ou prochain, avec l'action « Cours donné » sous le pouce) ;
// 2. la journée en frise ; 3. les raccourcis ; 4. ce qui reste à corriger.
import { useNavigate } from 'react-router-dom';
import { Users, PenSquare, ClipboardCheck, ChevronRight, Wallet, NotebookPen, Bell, Check, PartyPopper, Coffee, ArrowRight, Repeat } from 'lucide-react';
import { db, useCollection, useDoc } from '../../data/store';
import { Avatar } from '../../components/ui';
import { classStudents, gradesForEvaluation } from '../../data/compute';
import { dateShort, todayISO } from '../../lib/format';
import { useSession } from '../../lib/session';
import { callDone, canTeacherCall, replacementsOn, slotsOnDay, teachesCourse } from '../../lib/regles';
import { dayItems, type DayItem } from '../../lib/prof';
import { canValidate, checkOf } from '../../lib/paie';
import { giveCourse } from '../../lib/celebrate';
import { useNotifications } from '../../lib/notifications';
import { DayCard } from './TeacherSchedule';
import { hourLabel } from '../admin/Timetable';

export function useMyCourses() {
  const session = useSession()!;
  const courses = useCollection('courses');
  useCollection('classes');
  return courses.filter((c) => teachesCourse(session.user.staffId, c));
}

const now = () => new Date().toTimeString().slice(0, 5);
const dayLabel = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** Le cours qui compte maintenant : celui en cours, sinon le prochain, sinon le dernier de la journée. */
function focusOf(items: DayItem[]) {
  const t = now();
  return items.find((x) => x.debut <= t && t < x.fin) ?? items.find((x) => x.debut > t) ?? null;
}

export default function TeacherHome() {
  const nav = useNavigate();
  const session = useSession()!;
  const me = useDoc('staff', session.user.staffId);
  const courses = useMyCourses();
  const classes = useCollection('classes');
  const subjects = useCollection('subjects');
  const evaluations = useCollection('evaluations');
  useCollection('remplacements'); useCollection('timetable'); useCollection('agenda'); useCollection('attendance'); useCollection('grades'); useCollection('pointages');
  const unread = useNotifications().length;
  const date = todayISO();
  const today = dayItems(session.user.staffId, date);
  const schoolToday = today.filter((x) => x.kind !== 'externe' && x.slot);
  const given = schoolToday.filter((x) => checkOf(date, x.slot!.id)?.statut === 'valide').length;
  const focus = focusOf(today);
  const allDone = schoolToday.length > 0 && given === schoolToday.length;
  const myReps = replacementsOn().filter((r) => r.remplacantId === session.user.staffId);
  const toCall = classes.filter((c) => canTeacherCall(session.user.staffId, c) && !callDone(c.id));
  const appel = classes.some((c) => canTeacherCall(session.user.staffId, c));
  const myEvals = evaluations.filter((e) => courses.some((c) => c.id === e.coursId));
  const todo = myEvals.filter((e) => e.statut !== 'Clôturé' && gradesForEvaluation(e.id).size < classStudents(e.classeId).length).sort((a, b) => a.date.localeCompare(b.date));
  const subj = (id?: string) => subjects.find((s) => s.id === id)?.nom.split(' (')[0];
  const open = (x: DayItem) => nav(x.kind === 'externe' ? '/prof/emploi?vue=jour' : `/prof/cours/${x.slot!.id}`);
  const first = me?.prenom?.split(' ')[0] ?? session.user.nom;

  const actions: [string, string, React.ReactNode, string][] = [
    appel ? ['Appel', '/prof/appel', <ClipboardCheck key="a" />, 'qa-red'] : ['Classes', '/prof/classes', <Users key="c" />, 'qa-blue'],
    ['Notes', '/prof/notes', <PenSquare key="n" />, 'qa-violet'],
    ['Cahier', '/prof/cahier', <NotebookPen key="k" />, 'qa-green'],
    ['Finance', '/prof/finance', <Wallet key="f" />, 'qa-amber'],
  ];

  return (
    <div className="mob">
      <header className="mob-head">
        <button className="mob-avatar" onClick={() => nav('/profil')} aria-label="Mon profil"><Avatar src={me?.photo ?? session.user.photo} name={session.user.nom} size={48} /></button>
        <div className="grow">
          <span className="mob-sub">Bonjour,</span>
          <h1 className="mob-title">{first}</h1>
        </div>
        <button className="mob-icon" aria-label="Notifications" onClick={() => document.querySelector<HTMLButtonElement>('.appbar [aria-label="Notifications"], .topbar [aria-label="Notifications"]')?.click()}>
          <Bell />{unread > 0 && <i className="mob-dot" />}
        </button>
      </header>
      <p className="mob-date">{dayLabel()} · {today.length ? `${today.length} cours` : 'pas de cours'}</p>

      {/* 1. Maintenant */}
      {allDone ? (
        <section className="now now-done">
          <span className="now-ic"><PartyPopper /></span>
          <b className="now-title">Journée complète</b>
          <p>{given} cours donné{given > 1 ? 's' : ''} aujourd’hui. Merci pour votre travail.</p>
          <button className="now-link" onClick={() => nav('/prof/finance/heures')}>Voir mes heures du mois<ArrowRight size={16} /></button>
        </section>
      ) : focus ? (
        <FocusCard it={focus} date={date} given={given} total={schoolToday.length} onOpen={() => open(focus)} />
      ) : (
        <section className="now now-calm">
          <span className="now-ic"><Coffee /></span>
          <b className="now-title">{today.length ? 'Plus de cours aujourd’hui' : 'Pas de cours aujourd’hui'}</b>
          <p>{today.length ? `${given} cours donné${given > 1 ? 's' : ''} sur ${schoolToday.length}.` : 'Profitez-en pour préparer la suite.'}</p>
          <button className="now-link" onClick={() => nav('/prof/emploi')}>Voir ma semaine<ArrowRight size={16} /></button>
        </section>
      )}

      {/* Alertes du jour */}
      {myReps.map((r) => {
        const abs = db.get('staff', r.absentId);
        const cours = slotsOnDay(r.absentId).sort((a, b) => a.debut.localeCompare(b.debut));
        return (
          <button key={r.id} className="alert-row tint-orange" onClick={() => nav('/prof/emploi?vue=jour')}>
            <span className="alert-ic"><Repeat /></span>
            <span className="grow"><b>Vous remplacez {abs ? `${abs.sexe === 'F' ? 'Mme' : 'M.'} ${abs.nom}` : 'un collègue'}</b>
              <small>{cours.map((s) => `${hourLabel(s.debut)} ${classes.find((c) => c.id === s.classeId)?.code}`).join(' · ') || r.classeIds.map((id) => classes.find((c) => c.id === id)?.code).join(', ')}</small></span>
            <ChevronRight size={18} />
          </button>
        );
      })}
      {toCall.length > 0 && (
        <button className="alert-row tint-red" onClick={() => nav(`/prof/appel?classe=${toCall[0].id}`)}>
          <span className="alert-ic"><ClipboardCheck /></span>
          <span className="grow"><b>Appel à faire</b><small>{toCall.map((c) => c.code).join(', ')}</small></span>
          <ChevronRight size={18} />
        </button>
      )}

      {/* 2. Raccourcis */}
      <nav className="qa-row" aria-label="Raccourcis">
        {actions.map(([label, to, icon, tint]) => (
          <button key={to} onClick={() => nav(to)}><span className={`qa-ic ${tint}`}>{icon}</span>{label}</button>
        ))}
      </nav>

      {/* 3. La journée */}
      {today.length > 0 && (
        <section className="mob-section">
          <div className="sec-head"><h2>Aujourd’hui</h2><button onClick={() => nav('/prof/emploi')}>Semaine</button></div>
          <div className="stack" style={{ gap: 8 }}>{today.map((it) => <DayCard key={it.id} it={it} date={date} onOpen={open} />)}</div>
        </section>
      )}

      {/* 4. À corriger */}
      <section className="mob-section">
        <div className="sec-head"><h2>Notes à saisir</h2>{todo.length > 0 && <button onClick={() => nav('/prof/notes')}>Tout voir</button>}</div>
        {todo.length === 0 ? (
          <div className="empty-soft"><Check /><span>Toutes vos notes sont saisies.</span></div>
        ) : (
          <div className="stack" style={{ gap: 8 }}>{todo.slice(0, 4).map((e) => {
            const n = gradesForEvaluation(e.id).size; const t = classStudents(e.classeId).length;
            return (
              <button key={e.id} className="task-row" onClick={() => nav(`/prof/evaluation/${e.id}`)}>
                <span className="grow">
                  <b>{subj(e.matiereId)} · {classes.find((c) => c.id === e.classeId)?.code}</b>
                  <small>{e.titre} · {dateShort(e.date)}</small>
                  <span className="bar"><i style={{ width: `${t ? (n / t) * 100 : 0}%` }} /></span>
                </span>
                <span className="task-count">{n}<small>/{t}</small></span>
              </button>
            );
          })}</div>
        )}
      </section>
    </div>
  );
}

/** Carte « maintenant » : le cours en cours ou le prochain, avec l'action principale. */
function FocusCard({ it, date, given, total, onOpen }: { it: DayItem; date: string; given: number; total: number; onOpen: () => void }) {
  const session = useSession()!;
  const t = now();
  const live = it.debut <= t && t < it.fin;
  const check = it.slot ? checkOf(date, it.slot.id) : undefined;
  const can = !check && canValidate(it, date);
  return (
    <section className="now">
      <div className="now-top">
        <span className={`now-tag${live ? ' live' : ''}`}>{live ? 'En cours' : 'Prochain cours'}</span>
        {total > 0 && <span className="now-count">{given}/{total} donnés</span>}
      </div>
      <button className="now-main" onClick={onOpen}>
        <b className="now-title">{it.matiere}</b>
        <span>{it.classe}{it.salle && it.salle !== it.classe ? ` · ${it.salle}` : ''}{it.kind === 'externe' ? ` · ${it.ecole}` : ''}</span>
        <span className="now-time">{hourLabel(it.debut)} – {hourLabel(it.fin)}</span>
      </button>
      {total > 0 && <span className="now-bar"><i style={{ width: `${(given / total) * 100}%` }} /></span>}
      {check?.statut === 'valide' ? <div className="now-ok"><Check size={18} strokeWidth={3} />Cours validé</div>
        : can ? <button className="now-btn" onClick={(e) => giveCourse(it, date, session.user.staffId!, session.user.id, e)}><Check size={20} strokeWidth={2.6} />J’ai donné ce cours</button>
        : <button className="now-btn ghost" onClick={onOpen}>Préparer le cours<ArrowRight size={18} /></button>}
    </section>
  );
}
