// Espace professeur : journée de cours (école, remplacements, autres écoles), heures du mois, taux horaires.
import { db } from '../data/store';
import type { ClassRoom, ExternalSlot, ID, Niveau, TimetableSlot } from '../data/types';
import { replacementsOn, slotsOf } from './regles';

/** Seuls les professeurs du secondaire peuvent déclarer d'autres établissements. */
export function canMultiSchool(staffId?: ID) {
  if (!staffId) return false;
  const sec = new Set(db.list('classes').filter((c) => c.niveau === 'Secondaire').map((c) => c.id));
  return db.list('courses').some((c) => c.professeurId === staffId && sec.has(c.classeId));
}

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const weekday = (date: string) => ((new Date(date + 'T12:00:00').getDay() + 6) % 7) + 1; // lundi = 1 … dimanche = 7
export const SCHOOL_COLOR = '#1463f3';
export const OTHER_COLOR = '#8b5cf6';

export interface DayItem {
  id: string;
  kind: 'ecole' | 'remplacement' | 'externe';
  debut: string;
  fin: string;
  matiere: string;
  classe: string;
  classeId?: ID;
  salle?: string;
  ecole: string;
  slot?: TimetableSlot;
  ext?: ExternalSlot;
  color: string;
}

const subjName = (id?: ID) => db.get('subjects', id)?.nom.split(' (')[0];
const SUBJ_COLORS: Record<string, string> = { blue: '#1463f3', green: '#17a34a', pink: '#e2557a', violet: '#8b5cf6', amber: '#f0a500', cyan: '#0ea5c6', teal: '#0d9488', slate: '#64748b' };

/** Tous les cours d'un enseignant ce jour-là, triés par heure. */
export function dayItems(staffId: ID | undefined, date: string): DayItem[] {
  if (!staffId) return [];
  const day = weekday(date);
  const school = db.get('school', 'main')?.nom ?? 'École';
  const all = db.list('timetable');
  const fromSlot = (s: TimetableSlot, kind: DayItem['kind']): DayItem => {
    const subj = db.get('subjects', s.matiereId);
    return { id: `${kind}-${s.id}`, kind, debut: s.debut, fin: s.fin, matiere: subjName(s.matiereId) ?? s.libelle ?? 'Cours', classe: db.get('classes', s.classeId)?.code ?? '', classeId: s.classeId, salle: s.salle, ecole: school, slot: s, color: SUBJ_COLORS[subj?.couleur ?? ''] ?? SCHOOL_COLOR };
  };
  const items: DayItem[] = slotsOf(staffId, all).filter((s) => s.jour === day).map((s) => fromSlot(s, 'ecole'));
  for (const r of replacementsOn(date).filter((x) => x.remplacantId === staffId)) {
    for (const s of slotsOf(r.absentId, all).filter((x) => x.jour === day)) items.push({ ...fromSlot(s, 'remplacement'), matiere: `${subjName(s.matiereId) ?? s.libelle ?? 'Cours'} (remplacement)`, color: '#f0a500' });
  }
  const staff = db.get('staff', staffId);
  const active = new Map((staff?.autresEcoles ?? []).filter((e) => e.actif).map((e) => [e.id, e]));
  for (const x of db.list('agenda').filter((a) => a.staffId === staffId && a.jour === day && active.has(a.ecoleId))) {
    items.push({ id: `ext-${x.id}`, kind: 'externe', debut: x.debut, fin: x.fin, matiere: x.matiere, classe: x.classe, salle: x.salle, ecole: active.get(x.ecoleId)!.nom, ext: x, color: OTHER_COLOR });
  }
  return items.sort((a, b) => a.debut.localeCompare(b.debut));
}

/** Cours qui se chevauchent (même heure) : à signaler au professeur. */
export function clashes(items: DayItem[]) {
  return items.filter((a, i) => items.some((b, j) => j !== i && a.debut < b.fin && b.debut < a.fin));
}

/** Jours de classe d'un mois (lundi → vendredi, dans l'année scolaire, hors congés). */
export function schoolDays(ym: string) {
  const year = db.get('years', db.get('school', 'main')?.anneeCourante);
  const conges = new Set(db.list('events').filter((e) => e.type === 'Congé').map((e) => e.date));
  const [y, m] = ym.split('-').map(Number);
  const out: string[] = [];
  for (let d = new Date(y, m - 1, 1); d.getMonth() === m - 1; d.setDate(d.getDate() + 1)) {
    const s = iso(d);
    if (weekday(s) <= 5 && (!year || (s >= year.debut && s <= year.fin)) && !conges.has(s)) out.push(s);
  }
  return out;
}

/** Heures d'un mois dans cette école : prévues, annulées (absences), supplémentaires (remplacements), effectuées. */
export function monthHours(staffId: ID | undefined, ym: string) {
  const days = schoolDays(ym);
  const all = db.list('timetable');
  const mine = slotsOf(staffId, all);
  const absent = new Set(db.list('staffAttendance').filter((a) => a.staffId === staffId && a.statut === 'Absent').map((a) => a.date));
  let prevues = 0, annulees = 0, supp = 0;
  const weeks: { label: string; heures: number }[] = [];
  let wk = -1;
  for (const d of days) {
    if (wk < 0 || weekday(d) === 1) { weeks.push({ label: `Semaine ${weeks.length + 1}`, heures: 0 }); wk = weeks.length - 1; }
    const n = mine.filter((s) => s.jour === weekday(d)).length;
    prevues += n;
    const off = absent.has(d) ? n : 0;
    annulees += off;
    const rep = replacementsOn(d).filter((r) => r.remplacantId === staffId).reduce((a, r) => a + slotsOf(r.absentId, all).filter((s) => s.jour === weekday(d)).length, 0);
    supp += rep;
    weeks[wk].heures += n - off + rep;
  }
  return { prevues, annulees, supp, normales: prevues - annulees, effectuees: prevues - annulees + supp, weeks };
}

/** Taux horaire d'une matière à un niveau (réglé par la direction). */
export function rateFor(matiereId: ID, niveau: Niveau) {
  return db.get('school', 'main')?.tauxHoraires?.find((t) => t.matiereId === matiereId && t.niveau === niveau)?.taux;
}

/** Matières d'un enseignant : classes et heures par semaine. */
export function subjectLoad(staffId: ID | undefined) {
  const slots = slotsOf(staffId, db.list('timetable'));
  const courses = db.list('courses').filter((c) => c.professeurId === staffId);
  const by = new Map<ID, { classes: Set<ID>; heures: number; niveaux: Set<Niveau> }>();
  for (const c of courses) {
    const cl = db.get('classes', c.classeId) as ClassRoom | undefined;
    const x = by.get(c.matiereId) ?? { classes: new Set(), heures: 0, niveaux: new Set() };
    x.classes.add(c.classeId);
    if (cl) x.niveaux.add(cl.niveau);
    x.heures += slots.filter((s) => s.classeId === c.classeId && s.matiereId === c.matiereId).length || c.heuresSemaine;
    by.set(c.matiereId, x);
  }
  return [...by.entries()].map(([matiereId, x]) => ({ matiereId, nom: subjName(matiereId) ?? '', classes: x.classes.size, heures: x.heures, niveaux: [...x.niveaux] })).sort((a, b) => b.heures - a.heures);
}

/** Heures par semaine dans les autres établissements (agenda personnel). */
export function externalHours(staffId: ID | undefined, ecoleId?: ID) {
  return db.list('agenda').filter((a) => a.staffId === staffId && (!ecoleId || a.ecoleId === ecoleId)).length;
}
