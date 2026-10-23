// Emploi du temps du professeur : semaine, jour, mois ; cours de l'école, remplacements et autres établissements.
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, CalendarDays, NotebookPen, FileText, ClipboardCheck, ListChecks, School, AlertTriangle, Trash2 } from 'lucide-react';
import { db, useCollection } from '../../data/store';
import type { ExternalSlot } from '../../data/types';
import { Avatar, Empty, Field, Modal, ScreenHead, toast } from '../../components/ui';
import { classStudents } from '../../data/compute';
import { dateFull, fullName, todayISO } from '../../lib/format';
import { useSession } from '../../lib/session';
import { canTeacherCall } from '../../lib/regles';
import { canMultiSchool, clashes, dayItems, iso, weekday, type DayItem } from '../../lib/prof';
import { HOURS, hourLabel } from '../admin/Timetable';

const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const addDays = (date: string, n: number) => { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const monday = (date: string) => addDays(date, 1 - weekday(date));

/** Carte d'un cours (barre de couleur à gauche). */
export function DayCard({ it, onOpen }: { it: DayItem; onOpen: (it: DayItem) => void }) {
  return (
    <button className="day-card" onClick={() => onOpen(it)} style={{ borderLeftColor: it.color }}>
      <span className="grow">
        <span className="tiny muted">{hourLabel(it.debut)} – {hourLabel(it.fin)}</span>
        <b>{it.matiere}</b>
        <span className="small muted">{it.classe}{it.kind === 'externe' ? ` · ${it.ecole}` : ''}{it.salle && it.salle !== it.classe ? ` · ${it.salle}` : ''}</span>
      </span>
      <ChevronRight size={18} className="chev" />
    </button>
  );
}

export default function TeacherSchedule() {
  const session = useSession()!;
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const me = session.user.staffId;
  useCollection('timetable'); useCollection('agenda'); useCollection('remplacements'); useCollection('staff');
  const [view, setView] = useState<'semaine' | 'jour' | 'mois'>((params.get('vue') as 'jour') ?? 'semaine');
  const [date, setDate] = useState(params.get('date') ?? todayISO());
  const [form, setForm] = useState<Partial<ExternalSlot> | null>(null);
  // Un lien (accueil, notification) peut changer la vue ou la date alors que la page est déjà ouverte.
  useEffect(() => { const v = params.get('vue') as typeof view | null; const d = params.get('date'); if (v) setView(v); if (d) setDate(d); }, [params]); // eslint-disable-line
  const multi = canMultiSchool(me);
  const open = (it: DayItem) => (it.kind === 'externe' ? setForm(it.ext!) : nav(`/prof/cours/${it.slot!.id}?date=${date}`));
  const pick = (d: string) => { setDate(d); setParams({ vue: view, date: d }, { replace: true }); };
  const items = dayItems(me, date);
  const conflict = clashes(items);
  const week = Array.from({ length: 5 }, (_, i) => addDays(monday(date), i));

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <ScreenHead center title="Emploi du temps" onBack={() => nav('/')} />
      <div className="seg mb-12">{(['semaine', 'jour', 'mois'] as const).map((v) => <button key={v} className={view === v ? 'active' : ''} onClick={() => { setView(v); setParams({ vue: v, date }, { replace: true }); }}>{v[0].toUpperCase() + v.slice(1)}</button>)}</div>

      {view !== 'mois' && (
        <div className="week-strip mb-12">
          <button className="icon-btn" aria-label="Semaine précédente" onClick={() => pick(addDays(date, -7))}><ChevronLeft /></button>
          {week.map((d) => (
            <button key={d} className={`wd ${d === date ? 'on' : ''} ${d === todayISO() ? 'today' : ''}`} onClick={() => pick(d)}>
              <small>{JOURS_COURTS[weekday(d) - 1]}</small><b>{Number(d.slice(8))}</b>{dayItems(me, d).length > 0 && <i />}
            </button>
          ))}
          <button className="icon-btn" aria-label="Semaine suivante" onClick={() => pick(addDays(date, 7))}><ChevronRight /></button>
        </div>
      )}

      {view === 'mois' && <MonthCalendar date={date} onPick={pick} staffId={me} />}

      {view === 'semaine' ? (
        <div className="stack" style={{ gap: 14 }}>
          {week.map((d) => {
            const its = dayItems(me, d);
            return (
              <div key={d}>
                <div className="small mb-8" style={{ fontWeight: 600, color: d === date ? 'var(--primary)' : 'var(--ink)' }}>{dateFull(new Date(d + 'T12:00:00'))} · {its.length} cours</div>
                <div className="stack" style={{ gap: 8 }}>{its.map((it) => <DayCard key={it.id} it={it} onOpen={(x) => { setDate(d); open(x); }} />)}{its.length === 0 && <p className="small muted">Pas de cours.</p>}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="small mb-8" style={{ fontWeight: 600, color: 'var(--ink)' }}>{dateFull(new Date(date + 'T12:00:00'))} · {items.length} cours</div>
          {conflict.length > 0 && <div className="card card-pad mb-12 small row" style={{ background: 'var(--red-50)', border: 0, gap: 8 }}><AlertTriangle size={16} color="var(--red)" />Deux cours se chevauchent ce jour-là : vérifiez avec l’autre établissement.</div>}
          <div className="stack" style={{ gap: 8 }}>{items.map((it) => <DayCard key={it.id} it={it} onOpen={open} />)}</div>
          {items.length === 0 && <Empty title="Pas de cours ce jour-là" />}
        </div>
      )}

      {multi && <button className="fab" aria-label="Ajouter un cours dans un autre établissement" onClick={() => setForm({ jour: (Math.min(5, weekday(date)) as ExternalSlot['jour']), debut: '13:00', fin: '13:50' })}><Plus /></button>}
      {form && <AgendaForm value={form} onClose={() => setForm(null)} />}
    </div>
  );
}

function MonthCalendar({ date, onPick, staffId }: { date: string; onPick: (d: string) => void; staffId?: string }) {
  const [y, m] = date.split('-').map(Number);
  const first = `${y}-${String(m).padStart(2, '0')}-01`;
  const start = addDays(first, 1 - weekday(first));
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i)).filter((d, i) => i < 35 || d.slice(5, 7) === first.slice(5, 7));
  const shift = (n: number) => { const d = new Date(y, m - 1 + n, 1); onPick(iso(d)); };
  return (
    <div className="card card-pad mb-16">
      <div className="row between mb-8"><b style={{ color: 'var(--ink)' }}>{MOIS[m - 1][0].toUpperCase() + MOIS[m - 1].slice(1)} {y}</b><span className="row" style={{ gap: 4 }}><button className="icon-btn" aria-label="Mois précédent" onClick={() => shift(-1)}><ChevronLeft /></button><button className="icon-btn" aria-label="Mois suivant" onClick={() => shift(1)}><ChevronRight /></button></span></div>
      <div className="month-grid">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <small key={i}>{d}</small>)}
        {cells.map((d) => {
          const n = weekday(d) <= 5 ? dayItems(staffId, d).length : 0;
          return <button key={d} className={`${d === date ? 'on' : ''} ${d.slice(5, 7) !== first.slice(5, 7) ? 'out' : ''}`} onClick={() => onPick(d)}>{Number(d.slice(8))}{n > 0 && <i />}</button>;
        })}
      </div>
    </div>
  );
}

/** Cours dans un autre établissement (agenda personnel du professeur du secondaire). */
export function AgendaForm({ value, onClose }: { value: Partial<ExternalSlot>; onClose: () => void }) {
  const session = useSession()!;
  const me = db.get('staff', session.user.staffId);
  const schools = (me?.autresEcoles ?? []).filter((e) => e.actif);
  const [f, setF] = useState<Partial<ExternalSlot>>({ ecoleId: schools[0]?.id, ...value });
  const set = <K extends keyof ExternalSlot>(k: K, v: ExternalSlot[K]) => setF((x) => ({ ...x, [k]: v }));
  if (!schools.length) return (
    <Modal open onClose={onClose} title="Autre établissement" footer={<button className="btn btn-primary" onClick={onClose}>Compris</button>}>
      <p className="small">Ajoutez d’abord l’établissement dans <b>Mes écoles</b>, puis vos cours là-bas apparaîtront dans votre emploi du temps.</p>
    </Modal>
  );
  const save = () => {
    if (!f.ecoleId || !f.matiere?.trim() || !f.classe?.trim()) return toast('Établissement, matière et classe requis', true);
    if ((f.fin ?? '') <= (f.debut ?? '')) return toast('L’heure de fin doit suivre l’heure de début', true);
    db.put('agenda', { ...f, staffId: session.user.staffId!, matiere: f.matiere.trim(), classe: f.classe.trim() } as ExternalSlot);
    toast('Cours ajouté à votre emploi du temps');
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={f.id ? 'Cours dans un autre établissement' : 'Ajouter un cours ailleurs'}
      footer={<>{f.id && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => { db.remove('agenda', f.id!); toast('Cours retiré'); onClose(); }}><Trash2 size={15} />Retirer</button>}<button className="btn" onClick={onClose}>Annuler</button><button className="btn btn-primary" onClick={save}>Enregistrer</button></>}>
      <div className="form-grid">
        <Field label="Établissement" className="span-2"><select className="select" value={f.ecoleId} onChange={(e) => set('ecoleId', e.target.value)}>{schools.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></Field>
        <Field label="Jour"><select className="select" value={f.jour} onChange={(e) => set('jour', Number(e.target.value) as ExternalSlot['jour'])}>{['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></Field>
        <Field label="Heure"><select className="select" value={f.debut} onChange={(e) => { const h = HOURS.find((x) => x[0] === e.target.value); setF((x) => ({ ...x, debut: e.target.value, fin: h?.[1] ?? x.fin })); }}>{HOURS.map(([a, b]) => <option key={a} value={a}>{hourLabel(a)} – {hourLabel(b)}</option>)}</select></Field>
        <Field label="Matière"><input className="input" value={f.matiere ?? ''} onChange={(e) => set('matiere', e.target.value)} placeholder="Ex. Informatique" /></Field>
        <Field label="Classe"><input className="input" value={f.classe ?? ''} onChange={(e) => set('classe', e.target.value)} placeholder="Ex. S2-A" /></Field>
        <Field label="Salle" opt><input className="input" value={f.salle ?? ''} onChange={(e) => set('salle', e.target.value)} /></Field>
        <Field label="Élèves" opt><input type="number" min={0} className="input" value={f.eleves ?? ''} onChange={(e) => set('eleves', Number(e.target.value) || undefined)} /></Field>
      </div>
      <p className="tiny muted mt-12">Visible seulement par vous : l’école s’en sert pour éviter de vous donner cours à la même heure.</p>
    </Modal>
  );
}

/** Détail d'un cours de l'école : infos pratiques et raccourcis (élèves, programme, notes, devoirs, appel). */
export function CourseDetail() {
  const { slotId } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const session = useSession()!;
  const slot = useCollection('timetable').find((s) => s.id === slotId);
  const lessons = useCollection('lessons');
  const [tab, setTab] = useState<'eleves' | 'devoirs' | null>(null);
  if (!slot) return <Empty title="Cours introuvable" />;
  const date = params.get('date') ?? todayISO();
  const classe = db.get('classes', slot.classeId);
  const subj = db.get('subjects', slot.matiereId);
  const course = db.list('courses').find((c) => c.classeId === slot.classeId && c.matiereId === slot.matiereId);
  const students = classStudents(slot.classeId);
  const homework = lessons.filter((l) => l.classeId === slot.classeId && l.matiereId === slot.matiereId && l.devoirs).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const last = lessons.filter((l) => l.classeId === slot.classeId && l.matiereId === slot.matiereId).sort((a, b) => b.date.localeCompare(a.date))[0];
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <ScreenHead center title="Détail du cours" onBack={() => nav(-1)} />
      <div className="card card-pad mb-12" style={{ background: 'var(--primary-50)', border: 0 }}>
        <div className="row" style={{ gap: 12 }}><span className="tint-blue" style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center' }}><NotebookPen /></span>
          <div className="grow"><b style={{ color: 'var(--ink)', fontSize: 17 }}>{subj?.nom.split(' (')[0] ?? slot.libelle}</b><div className="small">{classe?.code}</div><div className="tiny muted row" style={{ gap: 4 }}><School size={12} />{db.get('school', 'main')?.nom}</div></div></div>
      </div>
      <div className="card card-pad mb-12 stack" style={{ gap: 10 }}>
        <div className="row small" style={{ gap: 10 }}><CalendarDays size={17} color="var(--primary)" />{dateFull(new Date(date + 'T12:00:00'))}</div>
        <div className="row small" style={{ gap: 10 }}><Clock size={17} color="var(--primary)" />{hourLabel(slot.debut)} – {hourLabel(slot.fin)}</div>
        <div className="row small" style={{ gap: 10 }}><MapPin size={17} color="var(--primary)" />{slot.salle || '—'}</div>
        <div className="row small" style={{ gap: 10 }}><Users size={17} color="var(--primary)" />{students.length} élèves</div>
        {last && <div className="tiny muted">Dernière séance : {last.titre}</div>}
      </div>
      <div className="card mb-12">
        <button className="sheet-row" onClick={() => setTab(tab === 'eleves' ? null : 'eleves')}><ListChecks />Liste des élèves<ChevronRight size={18} className="chev" style={{ marginLeft: 'auto' }} /></button>
        {tab === 'eleves' && <div className="list">{students.map((s, i) => <div key={s.id} className="list-item"><span className="muted small" style={{ width: 20 }}>{i + 1}</span><Avatar src={s.photo} name={fullName(s)} size={28} /><span className="grow small">{fullName(s)}</span></div>)}</div>}
        {course && <button className="sheet-row" onClick={() => nav(`/prof/cahier?cours=${course.id}`)}><NotebookPen />Programme / Chapitre<ChevronRight size={18} className="chev" style={{ marginLeft: 'auto' }} /></button>}
        {course && <button className="sheet-row" onClick={() => nav(`/prof/classes/${course.id}`)}><FileText />Notes<ChevronRight size={18} className="chev" style={{ marginLeft: 'auto' }} /></button>}
        <button className="sheet-row" onClick={() => setTab(tab === 'devoirs' ? null : 'devoirs')}><FileText />Devoirs<ChevronRight size={18} className="chev" style={{ marginLeft: 'auto' }} /></button>
        {tab === 'devoirs' && <div className="list">{homework.map((l) => <div key={l.id} className="list-item small" style={{ alignItems: 'flex-start' }}><span className="grow">{l.devoirs}<div className="tiny muted">Donné le {l.date}{l.pourLe ? ` · pour le ${l.pourLe}` : ''}</div></span></div>)}{homework.length === 0 && <p className="small muted card-pad">Aucun devoir noté.</p>}</div>}
        {canTeacherCall(session.user.staffId, classe, date) && <button className="sheet-row" onClick={() => nav(`/prof/appel?classe=${slot.classeId}`)}><ClipboardCheck />Faire l’appel<ChevronRight size={18} className="chev" style={{ marginLeft: 'auto' }} /></button>}
      </div>
    </div>
  );
}

