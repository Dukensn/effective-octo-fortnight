// Calculs pédagogiques : moyennes, rangs, appréciations, mentions, décisions.
// Toutes les notes sont ramenées sur 20 en interne puis affichées selon le barème choisi (/20 ou /100).
import { db } from './store';
import type { ClassRoom, Course, Evaluation, Grade, ID, Period, Student, Subject } from './types';

export const round1 = (n: number) => Math.round(n * 10) / 10;
export const fmtNote = (n: number | null | undefined, digits = 1) =>
  n === null || n === undefined || Number.isNaN(n) ? '-' : n.toFixed(digits).replace('.', ',');

export type Tone = 'excellent' | 'tres-bien' | 'bien' | 'assez-bien' | 'insuffisant' | 'tres-insuffisant';

export function appreciation(note20: number | null | undefined, bareme: 20 | 100 = 20): { label: string; tone: Tone } {
  if (note20 === null || note20 === undefined) return { label: '-', tone: 'bien' };
  if (bareme === 100) {
    const n = note20 * 5;
    if (n >= 90) return { label: 'Excellent', tone: 'excellent' };
    if (n >= 80) return { label: 'Très bien', tone: 'tres-bien' };
    if (n >= 70) return { label: 'Bien', tone: 'bien' };
    if (n >= 60) return { label: 'Assez bien', tone: 'assez-bien' };
    if (n >= 50) return { label: 'Insuffisant', tone: 'insuffisant' };
    return { label: 'Très insuffisant', tone: 'tres-insuffisant' };
  }
  if (note20 >= 17) return { label: 'Excellent', tone: 'excellent' };
  if (note20 >= 15) return { label: 'Très bien', tone: 'tres-bien' };
  if (note20 >= 13) return { label: 'Bien', tone: 'bien' };
  if (note20 >= 10) return { label: 'Assez bien', tone: 'assez-bien' };
  return { label: 'Insuffisant', tone: 'insuffisant' };
}

export const APPRECIATION_LEGEND: Record<20 | 100, { label: string; tone: Tone; range: string }[]> = {
  20: [
    { label: 'Excellent', tone: 'excellent', range: '17 – 20' },
    { label: 'Très bien', tone: 'tres-bien', range: '15 – 16,99' },
    { label: 'Bien', tone: 'bien', range: '13 – 14,99' },
    { label: 'Assez bien', tone: 'assez-bien', range: '10 – 12,99' },
    { label: 'Insuffisant', tone: 'insuffisant', range: '0 – 9,99' },
  ],
  100: [
    { label: 'Excellent', tone: 'excellent', range: '90 – 100' },
    { label: 'Très bien', tone: 'tres-bien', range: '80 – 89' },
    { label: 'Bien', tone: 'bien', range: '70 – 79' },
    { label: 'Assez bien', tone: 'assez-bien', range: '60 – 69' },
    { label: 'Insuffisant', tone: 'insuffisant', range: '50 – 59' },
    { label: 'Très insuffisant', tone: 'tres-insuffisant', range: '0 – 49' },
  ],
};

export function decision(note20: number | null, seuil20 = 10) {
  if (note20 === null) return 'En attente';
  if (note20 >= seuil20) return 'Admis(e) en classe supérieure';
  if (note20 >= seuil20 - 1) return 'Admis(e) sous condition';
  return 'Redouble';
}

export function generalComment(prenom: string, note20: number | null, sexe: 'M' | 'F' = 'M') {
  const e = sexe === 'F' ? 'e' : '';
  const il = sexe === 'F' ? 'Elle' : 'Il';
  if (note20 === null) return '';
  if (note20 >= 16) return `${prenom} est un${e} élève brillant${e}, sérieux${sexe === 'F' ? 'se' : ''} et respectueux${sexe === 'F' ? 'se' : ''}. ${il} obtient d'excellents résultats. Félicitations, continuez ainsi !`;
  if (note20 >= 14) return `${prenom} est un${e} élève sérieux${sexe === 'F' ? 'se' : ''}, travailleur${sexe === 'F' ? 'se' : ''} et respectueux${sexe === 'F' ? 'se' : ''}. ${il} a obtenu de très bons résultats. Nous l'encourageons à poursuivre sur cette voie.`;
  if (note20 >= 12) return `Bon travail dans l'ensemble. ${prenom} peut encore progresser avec plus de régularité.`;
  if (note20 >= 10) return `Résultats justes. ${prenom} doit fournir davantage d'efforts et mieux s'organiser.`;
  return `Résultats insuffisants. ${prenom} doit se ressaisir ; un suivi rapproché avec la famille est recommandé.`;
}

// ------------------------------------------------------------------
// Index mémorisés (recalculés seulement quand les collections changent)
// ------------------------------------------------------------------
let idxKey: unknown[] = [];
let idx: {
  gradesByEval: Map<ID, Map<ID, Grade>>;
  evalsByClass: Map<ID, Evaluation[]>;
} | null = null;

function index() {
  const grades = db.list('grades');
  const evals = db.list('evaluations');
  const deps = [grades, evals, db.list('courses'), db.list('students'), db.list('periods'), db.list('staff'), db.list('subjects'), db.list('school')];
  if (idx && deps.every((d, i) => d === idxKey[i])) return idx;
  const gradesByEval = new Map<ID, Map<ID, Grade>>();
  for (const g of grades) {
    let m = gradesByEval.get(g.evaluationId);
    if (!m) gradesByEval.set(g.evaluationId, (m = new Map()));
    m.set(g.eleveId, g);
  }
  const evalsByClass = new Map<ID, Evaluation[]>();
  for (const e of evals) {
    let l = evalsByClass.get(e.classeId);
    if (!l) evalsByClass.set(e.classeId, (l = []));
    l.push(e);
  }
  idx = { gradesByEval, evalsByClass };
  idxKey = deps;
  reportCache.clear();
  return idx;
}

export function gradesForEvaluation(evalId: ID) {
  return index().gradesByEval.get(evalId) ?? new Map<ID, Grade>();
}

export function evaluationsForClass(classeId: ID) {
  return index().evalsByClass.get(classeId) ?? [];
}

export function classStudents(classeId: ID): Student[] {
  return db
    .list('students')
    .filter((s) => s.classeId === classeId && s.statut === 'Actif')
    .sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom, 'fr'));
}

export function sortedPeriods(): Period[] {
  const school = db.get('school', 'main');
  return db.list('periods').filter((p) => p.anneeId === school?.anneeCourante).sort((a, b) => a.ordre - b.ordre);
}

export interface SubjectLine {
  course: Course;
  subject: Subject;
  profNom: string;
  byPeriod: Record<ID, number | null>; // moyenne /20 de la matière par période
  value: number | null; // moyenne de la matière pour l'étendue demandée (/20)
  classAvg: number | null;
}
export interface StudentReport {
  student: Student;
  lines: SubjectLine[];
  byPeriod: Record<ID, number | null>; // moyenne générale par période
  general: number | null;
  rank: number;
  totalCoef: number;
}
export interface ClassReport {
  classe: ClassRoom;
  periods: Period[];
  scope: ID | 'annuel';
  students: StudentReport[];
  classGeneral: number | null;
  classByPeriod: Record<ID, number | null>;
  subjectClassAvg: Record<ID, number | null>;
  effectif: number;
  best: number | null;
  worst: number | null;
  successRate: number;
}

const reportCache = new Map<string, ClassReport>();

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x !== null && !Number.isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

function weighted(pairs: [number | null, number][]) {
  let s = 0;
  let c = 0;
  for (const [v, w] of pairs) if (v !== null) { s += v * w; c += w; }
  return c ? s / c : null;
}

/** Rapport complet d'une classe, pour une période ou l'année (annuel = moyenne des périodes). */
export function classReport(classeId: ID, scope: ID | 'annuel'): ClassReport | null {
  index();
  const key = `${classeId}|${scope}`;
  const cached = reportCache.get(key);
  if (cached) return cached;
  const classe = db.get('classes', classeId);
  if (!classe) return null;
  const allPeriods = sortedPeriods();
  const periods = scope === 'annuel' ? allPeriods : allPeriods.filter((p) => p.id === scope);
  const courses = db.list('courses').filter((c) => c.classeId === classeId);
  const subjects = new Map(db.list('subjects').map((s) => [s.id, s]));
  const staff = new Map(db.list('staff').map((s) => [s.id, s]));
  const evals = evaluationsForClass(classeId);
  const students = classStudents(classeId);
  const subjOrder = db.list('subjects').map((s) => s.id);
  courses.sort((a, b) => subjOrder.indexOf(a.matiereId) - subjOrder.indexOf(b.matiereId));

  // moyenne d'un élève dans un cours pour une période
  const evalsByCoursePeriod = new Map<string, Evaluation[]>();
  for (const e of evals) {
    const k = `${e.coursId}|${e.periodeId}`;
    const l = evalsByCoursePeriod.get(k) ?? [];
    l.push(e);
    evalsByCoursePeriod.set(k, l);
  }
  const cell = (studentId: ID, courseId: ID, periodId: ID): number | null => {
    const es = evalsByCoursePeriod.get(`${courseId}|${periodId}`);
    if (!es) return null;
    const notes: number[] = [];
    for (const e of es) {
      const g = gradesForEvaluation(e.id).get(studentId);
      if (g && g.note !== null && !g.absent) notes.push((g.note / e.noteMax) * 20);
    }
    return notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null;
  };

  const reports: StudentReport[] = students.map((student) => {
    const lines: SubjectLine[] = courses.map((course) => {
      const byPeriod: Record<ID, number | null> = {};
      for (const p of allPeriods) byPeriod[p.id] = cell(student.id, course.id, p.id);
      const value = scope === 'annuel' ? avg(allPeriods.map((p) => byPeriod[p.id])) : byPeriod[scope];
      const prof = staff.get(course.professeurId ?? '');
      return {
        course, subject: subjects.get(course.matiereId)!, byPeriod, value, classAvg: null,
        profNom: prof ? `${prof.sexe === 'F' ? 'Mme' : 'M.'} ${prof.prenom} ${prof.nom}` : '—',
      };
    });
    const byPeriod: Record<ID, number | null> = {};
    for (const p of allPeriods) byPeriod[p.id] = weighted(lines.map((l) => [l.byPeriod[p.id], l.course.coefficient]));
    const general = weighted(lines.map((l) => [l.value, l.course.coefficient]));
    return { student, lines, byPeriod, general, rank: 0, totalCoef: courses.reduce((a, c) => a + c.coefficient, 0) };
  });

  // rangs (ex-aequo gérés)
  const ranked = [...reports].filter((r) => r.general !== null).sort((a, b) => b.general! - a.general!);
  ranked.forEach((r, i) => {
    r.rank = i > 0 && round1(ranked[i - 1].general!) === round1(r.general!) ? ranked[i - 1].rank : i + 1;
  });

  const subjectClassAvg: Record<ID, number | null> = {};
  courses.forEach((c, ci) => {
    const a = avg(reports.map((r) => r.lines[ci].value));
    subjectClassAvg[c.matiereId] = a;
    reports.forEach((r) => (r.lines[ci].classAvg = a));
  });
  const classByPeriod: Record<ID, number | null> = {};
  for (const p of allPeriods) classByPeriod[p.id] = avg(reports.map((r) => r.byPeriod[p.id]));
  const gens = reports.map((r) => r.general).filter((x): x is number => x !== null);
  const seuil = (db.get('school', 'main')?.seuilReussite ?? 10) * (db.get('school', 'main')?.bareme === 100 ? 0.2 : 1);

  const out: ClassReport = {
    classe, periods, scope, students: reports, classGeneral: avg(gens), classByPeriod, subjectClassAvg,
    effectif: students.length, best: gens.length ? Math.max(...gens) : null, worst: gens.length ? Math.min(...gens) : null,
    successRate: gens.length ? gens.filter((g) => g >= seuil).length / gens.length : 0,
  };
  reportCache.set(key, out);
  return out;
}

/** Statistiques d'une évaluation (palmarès). */
export function evaluationStats(ev: Evaluation) {
  const students = classStudents(ev.classeId);
  const grades = gradesForEvaluation(ev.id);
  const rows = students.map((s) => ({ student: s, grade: grades.get(s.id) }));
  const notes = rows.map((r) => r.grade?.note).filter((n): n is number => n !== null && n !== undefined);
  const ranked = rows.filter((r) => r.grade?.note != null).sort((a, b) => b.grade!.note! - a.grade!.note!);
  const rankOf = new Map<ID, number>();
  ranked.forEach((r, i) => rankOf.set(r.student.id, i > 0 && ranked[i - 1].grade!.note === r.grade!.note ? rankOf.get(ranked[i - 1].student.id)! : i + 1));
  return {
    rows, ranked, rankOf,
    saisies: notes.length,
    total: students.length,
    moyenne: notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null,
    max: notes.length ? Math.max(...notes) : null,
    min: notes.length ? Math.min(...notes) : null,
  };
}

/** Bornes d'affichage selon barème. */
export function scaleNote(note20: number | null, bareme: 20 | 100) {
  if (note20 === null) return null;
  return bareme === 100 ? note20 * 5 : note20;
}

/**
 * Conseil de classe automatique : appréciation, conduite, observations et décision
 * déduites des notes, des absences/retards et des incidents. Modifiable ensuite.
 */
export function autoCouncil(r: StudentReport, scope: ID | 'annuel', seuil20 = 10) {
  const st = r.student;
  const p = scope === 'annuel' ? undefined : db.get('periods', scope);
  const inPeriod = (d: string) => !p || (d >= p.debut && d <= p.fin);
  const att = db.list('attendance').filter((a) => a.eleveId === st.id && inPeriod(a.date));
  const absNJ = att.filter((a) => a.statut === 'Absent').length;
  const retards = att.filter((a) => a.statut === 'Retard').length;
  const incidents = db.list('incidents').filter((i) => i.eleveId === st.id && i.type !== 'Félicitations' && inPeriod(i.date)).length;
  const g = r.general;
  const score = absNJ * 2 + retards + incidents * 3;
  const conduite = score === 0 ? (g != null && g >= 15 ? 'Excellente' : 'Très bonne') : score <= 3 ? 'Bonne' : score <= 7 ? 'Assez bonne' : 'À améliorer';
  const weak = r.lines.filter((l) => l.value != null && (l.value < 12 || (l.classAvg != null && l.value < l.classAvg - 1))).sort((a, b) => a.value! - b.value!).slice(0, 2).map((l) => l.subject.nom.split(' (')[0].toLowerCase());
  const observations = weak.length ? `Renforcer les efforts en ${weak.join(' et en ')}.` + (absNJ + retards > 3 ? ' Améliorer la ponctualité et l’assiduité.' : '') : 'Maintenir ce bon niveau dans toutes les matières.';
  const periodDecision = g == null ? 'En attente' : g >= 16 ? 'Félicitations' : g >= 14 ? 'Tableau d’honneur' : g >= seuil20 ? 'Encouragements' : 'Avertissement';
  return {
    appreciation: generalComment(st.prenom, g, st.sexe),
    observations,
    decision: scope === 'annuel' ? decision(g, seuil20) : periodDecision,
    comportement: {
      conduite,
      collaboration: g != null && g >= 15 ? 'Excellent' : g != null && g >= 12 ? 'Bon' : 'Moyen',
      respect: incidents === 0 ? 'Très bon' : 'À améliorer',
      participation: g != null && g >= 12 ? 'Active' : g != null && g >= 10 ? 'Moyenne' : 'Faible',
    },
  };
}
