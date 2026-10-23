// Règles qui changent selon le niveau de la classe.
// - Chaque classe a une organisation (maître unique, équipe, un professeur par matière, co-titulaires).
// - Co-titulaires (souvent au préscolaire) : à égalité sur tout (appel, évaluation de tous les domaines, livret).
// - Préscolaire et fondamental : les professeurs de la classe font l'appel et peuvent écrire aux parents.
// - Secondaire : l'appel est fait par le personnel désigné ; seuls l'administration écrit aux parents.
// Partout : un seul appel par jour et par classe.
import { db } from '../data/store';
import type { ClassRoom, Course, ID, TimetableSlot } from '../data/types';
import { todayISO } from './format';

/** Règles réglables dans Paramètres → Matières & règles. */
export function schoolRules() {
  const s = db.get('school', 'main');
  return { chargeMax: s?.chargeMaxHeures ?? 30, seuilRetards: Math.max(1, s?.seuilRetards ?? 1), alerteAbsence: s?.alerteAbsence ?? true, alerteConduite: s?.alerteConduite ?? true };
}

export const isSecondaire = (c?: Pick<ClassRoom, 'niveau'> | null) => c?.niveau === 'Secondaire';

export type Organisation = NonNullable<ClassRoom['organisation']>;
export const ORGANISATIONS: { key: Organisation; label: string; desc: string; pour: ClassRoom['niveau'][] }[] = [
  { key: 'unique', label: 'Maître unique', desc: 'Un seul enseignant fait toutes les matières de la classe.', pour: ['Préscolaire', 'Fondamental'] },
  { key: 'equipe', label: 'Équipe', desc: 'Deux ou trois enseignants se partagent les matières.', pour: ['Fondamental'] },
  { key: 'matiere', label: 'Un professeur par matière', desc: 'Chaque matière a son professeur, comme au secondaire.', pour: ['Fondamental', 'Secondaire'] },
  { key: 'cotitulaires', label: 'Co-titulaires', desc: 'Plusieurs enseignants à égalité sur tout : appel, toutes les évaluations, livret.', pour: ['Préscolaire'] },
];

/** Organisation de la classe ; sans choix enregistré, on la déduit du niveau et des affectations. */
export function organisationOf(c?: ClassRoom | null): Organisation {
  if (!c) return 'matiere';
  if (c.organisation) return c.organisation;
  if (c.niveau === 'Préscolaire') return (c.cotitulaireIds?.length ?? 0) > 0 ? 'cotitulaires' : 'unique';
  if (c.niveau === 'Secondaire') return 'matiere';
  const profs = new Set(db.list('courses').filter((x) => x.classeId === c.id).map((x) => x.professeurId).filter(Boolean));
  return profs.size <= 1 ? 'unique' : 'matiere';
}

/** Titulaire et membres de l'équipe (sans doublon). En maître unique : le titulaire seul. */
export function classTeacherIds(c?: ClassRoom | null): ID[] {
  if (!c) return [];
  const team = organisationOf(c) === 'unique' ? [] : c.cotitulaireIds ?? [];
  return [...new Set([c.titulaireId, ...team].filter((x): x is ID => !!x))];
}

/** Un professeur enseigne ce cours : il en est chargé, ou il est co-titulaire (à égalité sur tout). */
export function teachesCourse(staffId: ID | undefined, course?: Course | null) {
  if (!staffId || !course) return false;
  if (course.professeurId === staffId) return true;
  const c = db.get('classes', course.classeId);
  return organisationOf(c) === 'cotitulaires' && classTeacherIds(c).includes(staffId);
}

/** Affecte un cours et aligne l'emploi du temps : les créneaux de cette matière dans cette classe suivent. */
export function assignCourse(course: Course, profId: ID | undefined) {
  if (course.professeurId !== profId) db.patch('courses', course.id, { professeurId: profId });
  for (const s of db.list('timetable')) {
    if (s.classeId === course.classeId && s.matiereId === course.matiereId && s.professeurId !== profId) db.patch('timetable', s.id, { professeurId: profId });
  }
}

/** Au démarrage : corrige les créneaux restés sur un ancien professeur (données d'avant l'écran Équipe). */
export function reconcileTimetable() {
  const byKey = new Map(db.list('courses').map((c) => [`${c.classeId}|${c.matiereId}`, c.professeurId]));
  for (const s of db.list('timetable')) {
    if (!s.matiereId) continue;
    const prof = byKey.get(`${s.classeId}|${s.matiereId}`);
    if (prof && prof !== s.professeurId) db.patch('timetable', s.id, { professeurId: prof });
  }
}

/** Créneaux d'un enseignant : ceux qu'il assure, plus ceux de ses classes en co-titulaires. */
export function slotsOf(staffId: ID | undefined, slots: TimetableSlot[]) {
  if (!staffId) return [];
  const courses = db.list('courses');
  return slots.filter((s) => s.professeurId === staffId || (!!s.matiereId && teachesCourse(staffId, courses.find((c) => c.classeId === s.classeId && c.matiereId === s.matiereId))));
}

export function myCourses(staffId: ID | undefined) {
  return db.list('courses').filter((c) => teachesCourse(staffId, c));
}

export function teachesInClass(staffId: ID | undefined, classeId: ID) {
  if (!staffId) return false;
  return classTeacherIds(db.get('classes', classeId)).includes(staffId) || db.list('courses').some((c) => c.classeId === classeId && c.professeurId === staffId);
}

/** Remplacements du jour (un par enseignant absent). */
export const replacementsOn = (date = todayISO()) => db.list('remplacements').filter((r) => r.date === date);

/** Appel par un professeur : jamais au secondaire ; ailleurs, le(s) titulaire(s), ou à défaut un professeur de la classe.
 *  Le jour d'un remplacement, le remplaçant fait l'appel à la place de l'enseignant absent. */
export function canTeacherCall(staffId: ID | undefined, c?: ClassRoom | null, date = todayISO()) {
  if (!staffId || !c || isSecondaire(c)) return false;
  if (replacementsOn(date).some((r) => r.remplacantId === staffId && r.classeIds.includes(c.id))) return true;
  const tit = classTeacherIds(c);
  return tit.length ? tit.includes(staffId) : teachesInClass(staffId, c.id);
}

/** Classes touchées par l'absence d'un enseignant ce jour-là : celles dont il fait l'appel et celles où il a cours. */
export function classesOfAbsent(staffId: ID, date = todayISO()): ID[] {
  const day = ((new Date(date + 'T12:00:00').getDay() + 6) % 7) + 1; // lundi = 1
  const ids = new Set<ID>();
  for (const c of db.list('classes')) if (!isSecondaire(c) && classTeacherIds(c).includes(staffId)) ids.add(c.id);
  for (const s of slotsOf(staffId, db.list('timetable'))) if (s.jour === day) ids.add(s.classeId);
  return [...ids];
}

/** Cours de l'enseignant ce jour-là (créneaux), pour voir les conflits du remplaçant. */
export function slotsOnDay(staffId: ID | undefined, date = todayISO()) {
  const day = ((new Date(date + 'T12:00:00').getDay() + 6) % 7) + 1;
  return slotsOf(staffId, db.list('timetable')).filter((s) => s.jour === day);
}

/** Un professeur peut écrire aux parents d'une classe du préscolaire ou du fondamental où il enseigne. */
export function canTeacherMessage(staffId: ID | undefined, c?: ClassRoom | null) {
  return !!c && !isSecondaire(c) && teachesInClass(staffId, c.id);
}

export const callDoneId = (date: string, classeId: ID) => `at-${date}-${classeId}-done`;
export const callDone = (classeId: ID, date = todayISO()) => !!db.get('attendance', callDoneId(date, classeId));

/** Classes sans appel aujourd'hui (jours de classe, à partir de 8 h). */
export function missingCalls(now = new Date()): ClassRoom[] {
  if (now.getDay() === 0 || now.getHours() < 8) return [];
  const withStudents = new Set(db.list('students').filter((s) => s.statut === 'Actif').map((s) => s.classeId));
  return db.list('classes').filter((c) => withStudents.has(c.id) && !callDone(c.id));
}

/** Qui doit faire l'appel de cette classe (pour l'afficher). */
export function callerLabel(c: ClassRoom) {
  const name = (id?: ID) => { const s = db.get('staff', id); return s ? `${s.sexe === 'F' ? 'Mme' : 'M.'} ${s.prenom} ${s.nom}` : undefined; };
  if (isSecondaire(c)) return name(c.appelParId) ?? 'Administration';
  const rep = replacementsOn().find((r) => r.classeIds.includes(c.id) && r.remplacantId);
  if (rep) return `${name(rep.remplacantId)} (remplace ${name(rep.absentId)})`;
  const t = classTeacherIds(c).map(name).filter(Boolean);
  return t.length ? t.join(', ') : 'Professeurs de la classe';
}
