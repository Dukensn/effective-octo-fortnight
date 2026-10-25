// Prise en main : tutoriel du premier jour, astuce au premier passage sur un écran,
// carte « Mise en route » et rappel « pas encore fait » de temps en temps.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, Users, Wallet, Settings, CalendarDays, PenSquare, MessageCircle, FileText, Lightbulb, X, Check, ChevronRight, Rocket, BellRing } from 'lucide-react';
import { useCollection } from '../data/store';
import { useSession } from '../lib/session';
import { TIPS, TOUR, espaceOf, markSeen, reminderDue, reminderOfTheDay, seen, setupSteps } from '../lib/guide';
import { pushEnabled, show } from '../lib/push';
import { db } from '../data/store';

const ICONS: Record<string, typeof Home> = { home: Home, plus: Plus, users: Users, wallet: Wallet, settings: Settings, calendar: CalendarDays, pen: PenSquare, message: MessageCircle, file: FileText };

/** Le tutoriel du premier jour (une seule fois par compte ; « Revoir le tutoriel » dans Aide). */
export function WelcomeTour() {
  const session = useSession();
  const [i, setI] = useState(0);
  if (!session || seen(session.user, 'tour')) return null;
  const slides = TOUR[espaceOf(session)];
  const s = slides[i];
  const Icon = ICONS[s.icon] ?? Home;
  const done = () => markSeen(session.user, 'tour');
  const last = i === slides.length - 1;
  return (
    <div className="tour-backdrop">
      <div className="tour" role="dialog" aria-modal="true" aria-label="Tutoriel">
        <button className="tour-skip" onClick={done}>Passer</button>
        <div key={i} className="tour-slide">
          <span className={`tour-ic tint-${s.tint}`}><Icon /></span>
          <h2>{s.title}</h2>
          <p>{s.text}</p>
        </div>
        <div className="tour-dots">{slides.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
        <div className="tour-actions">
          {i > 0 && <button className="btn btn-lg" onClick={() => setI(i - 1)}>Retour</button>}
          <button className="btn btn-primary btn-lg grow" onClick={() => (last ? done() : setI(i + 1))}>{last ? 'Commencer' : 'Suivant'}</button>
        </div>
      </div>
    </div>
  );
}

/** Astuce montrée la première fois qu'on ouvre un écran. */
export function RouteTip({ path }: { path: string }) {
  const session = useSession();
  if (!session || !seen(session.user, 'tour')) return null;
  const tip = TIPS.find((t) => t.espace === espaceOf(session) && t.path.test(path));
  if (!tip) return null;
  const key = `tip:${tip.path.source}`;
  if (seen(session.user, key)) return null;
  return (
    <div className="tip">
      <span className="tip-ic"><Lightbulb /></span>
      <span className="grow"><b>{tip.title}</b><small>{tip.text}</small></span>
      <button className="tip-ok" onClick={() => markSeen(session.user, key)} aria-label="Compris"><Check size={16} />Compris</button>
    </div>
  );
}

/** Carte « Mise en route » : ce qui reste à faire, avec la progression. Disparaît quand tout est prêt. */
export function SetupCard() {
  const session = useSession()!;
  const nav = useNavigate();
  useCollection('students'); useCollection('classes'); useCollection('staff'); useCollection('users'); useCollection('timetable'); useCollection('periods'); useCollection('school');
  const [open, setOpen] = useState(false);
  const steps = setupSteps(session);
  const done = steps.filter((x) => x.done).length;
  if (!steps.length || done === steps.length || seen(session.user, 'setup-off')) return null;
  const todo = steps.filter((x) => !x.done);
  return (
    <div className="card setup mb-16">
      <div className="setup-head">
        <span className="setup-ic"><Rocket /></span>
        <span className="grow"><b>Mise en route</b><small>{done} sur {steps.length} étapes faites</small></span>
        <button className="icon-btn" aria-label="Masquer" title="Masquer cette carte" onClick={() => markSeen(session.user, 'setup-off')}><X size={18} /></button>
      </div>
      <span className="setup-bar"><i style={{ width: `${(done / steps.length) * 100}%` }} /></span>
      <div className="setup-list">
        {(open ? todo : todo.slice(0, 3)).map((x) => (
          <button key={x.id} className="setup-row" onClick={() => nav(x.to)}>
            <span className="setup-dot" /><span className="grow"><b>{x.label}</b><small>{x.sub}</small></span><ChevronRight size={18} className="chev" />
          </button>
        ))}
      </div>
      {todo.length > 3 && <button className="setup-more" onClick={() => setOpen(!open)}>{open ? 'Voir moins' : `Voir les ${todo.length - 3} autres`}</button>}
    </div>
  );
}

/** Rappel « pas encore fait » : au plus un tous les N jours, une étape différente à chaque fois. */
export function SetupReminder() {
  const session = useSession();
  const nav = useNavigate();
  const [shown, setShown] = useState<{ label: string; sub: string; to: string; left: number } | null>(null);
  const ready = !!session && seen(session.user, 'tour');
  const pick = useMemo(() => (session && ready && reminderDue(session.user) ? reminderOfTheDay(setupSteps(session)) : null), [session?.user.id, ready]); // eslint-disable-line
  useEffect(() => {
    if (!pick || !session) return;
    const t = setTimeout(() => {
      setShown({ ...pick.step, left: pick.left });
      db.patch('users', session.user.id, { dernierRappel: Date.now() });
      if (pushEnabled()) void show('Pas encore fait', pick.step.label, pick.step.to);
    }, 2500);
    return () => clearTimeout(t);
  }, [pick]); // eslint-disable-line
  if (!shown) return null;
  return (
    <div className="reminder" role="status">
      <span className="reminder-ic"><BellRing /></span>
      <span className="grow"><small>Pas encore fait{shown.left > 1 ? ` · ${shown.left} étapes restantes` : ''}</small><b>{shown.label}</b></span>
      <button className="btn btn-sm btn-primary" onClick={() => { setShown(null); nav(shown.to); }}>Le faire</button>
      <button className="icon-btn" aria-label="Plus tard" onClick={() => setShown(null)}><X size={18} /></button>
    </div>
  );
}
