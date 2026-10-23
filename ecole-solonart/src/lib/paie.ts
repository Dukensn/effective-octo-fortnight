// Paie des professeurs : salaire fixe ou à l'heure, au choix de la direction.
// Paie à l'heure = heures de cours validées dans le mois × taux (de la matière au niveau, ou taux propre au professeur).
// Validation d'un cours : bouton « Cours donné » le jour même (à partir de 10 min avant le début), ou automatiquement
// quand le professeur remplit le cahier de textes de ce cours ou fait l'appel de cette classe ce jour-là.
import { db } from '../data/store';
import type { CourseCheck, ID, Niveau, Salary, Staff } from '../data/types';
import { todayISO } from './format';
import { audit } from './session';
import { canMultiSchool, dayItems, rateFor, type DayItem } from './prof';

export type Remuneration = NonNullable<Staff['remuneration']>;

/** Mode de paie : choix de la direction ; par défaut à l'heure au secondaire, fixe ailleurs. */
export function remunerationOf(s?: Staff | null): Remuneration {
  if (!s) return 'fixe';
  if (s.remuneration) return s.remuneration;
  return s.type === 'Professeur' && canMultiSchool(s.id) ? 'horaire' : 'fixe';
}

export const checkId = (date: string, slotId: ID) => `pt-${date}-${slotId}`;
export const checkOf = (date: string, slotId: ID) => db.get('pointages', checkId(date, slotId));

const minutes = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
const nowMinutes = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

/** Le professeur peut valider ce cours : seulement le jour même, à partir de 10 min avant le début. */
export function canValidate(it: DayItem, date: string) {
  return it.kind !== 'externe' && !!it.slot && date === todayISO() && nowMinutes() >= minutes(it.debut) - 10;
}

function put(it: DayItem, date: string, staffId: ID, source: CourseCheck['source'], parId?: ID, statut: CourseCheck['statut'] = 'valide', motif?: string) {
  const s = it.slot!;
  return db.put('pointages', { id: checkId(date, s.id), date, slotId: s.id, staffId, classeId: s.classeId, matiereId: s.matiereId, debut: s.debut, fin: s.fin, statut, source, le: Date.now(), parId, motif });
}

/** « Cours donné » touché par le professeur. */
export function validateCourse(it: DayItem, date: string, staffId: ID, userId: ID) {
  if (!canValidate(it, date) || checkOf(date, it.slot!.id)) return null;
  return put(it, date, staffId, 'prof', userId);
}

/** Validation automatique (cahier de textes ou appel) : les cours de ce jour, déjà commencés, de cette classe. */
export function autoValidate(staffId: ID | undefined, date: string, classeId: ID, matiereId: ID | undefined, source: 'cahier' | 'appel', userId?: ID) {
  if (!staffId || date !== todayISO()) return 0;
  let n = 0;
  for (const it of dayItems(staffId, date)) {
    if (it.kind === 'externe' || !it.slot || it.slot.classeId !== classeId) continue;
    if (matiereId && it.slot.matiereId !== matiereId) continue;
    if (nowMinutes() < minutes(it.debut) - 10 || checkOf(date, it.slot.id)) continue;
    put(it, date, staffId, source, userId);
    n++;
  }
  return n;
}

/** Décision de la direction : valider (oubli) ou refuser un cours, n'importe quel jour. */
export function decideCourse(it: DayItem, date: string, staffId: ID, statut: CourseCheck['statut'], userId: ID, motif?: string) {
  const c = put(it, date, staffId, 'direction', userId, statut, motif);
  audit(statut === 'valide' ? 'Cours validé par la direction' : 'Cours refusé', `${it.matiere} ${it.classe} · ${date}`, { domaine: 'finance', motif });
  return c;
}

/** Paie à l'heure d'un mois : heures validées regroupées par matière et niveau. */
export function monthPay(staffId: ID | undefined, ym: string) {
  const st = db.get('staff', staffId);
  const by = new Map<string, { matiereId: ID; niveau: Niveau; heures: number; taux: number }>();
  for (const c of db.list('pointages')) {
    if (c.staffId !== staffId || c.statut !== 'valide' || !c.date.startsWith(ym) || !c.matiereId) continue;
    const niveau = db.get('classes', c.classeId)?.niveau ?? 'Secondaire';
    const k = `${c.matiereId}|${niveau}`;
    const x = by.get(k) ?? { matiereId: c.matiereId, niveau, heures: 0, taux: st?.tauxPerso ?? rateFor(c.matiereId, niveau) ?? 0 };
    x.heures++;
    by.set(k, x);
  }
  const detail = [...by.values()].sort((a, b) => b.heures - a.heures);
  return { detail, heures: detail.reduce((a, d) => a + d.heures, 0), montant: detail.reduce((a, d) => a + d.heures * d.taux, 0) };
}

/** Crée ou met à jour les fiches de paie « à l'heure » d'un mois (sans toucher aux fiches déjà payées). */
export function computeHourlySalaries(ym: string) {
  const out: Salary[] = [];
  for (const s of db.list('staff')) {
    if (s.statut !== 'Actif' || s.type !== 'Professeur' || remunerationOf(s) !== 'horaire') continue;
    const id = `sal-${s.id}-${ym.replace('-', '')}`;
    const cur = db.get('salaries', id);
    if (cur?.statut === 'Payé') continue;
    const p = monthPay(s.id, ym);
    out.push(db.put('salaries', { id, staffId: s.id, periode: ym, montant: p.montant, heures: p.heures, detail: p.detail, primes: cur?.primes ?? 0, retenues: Math.round(p.montant * 0.02), statut: 'En attente', mode: s.modePaiement }));
  }
  audit('Calcul des salaires à l’heure', `${ym} · ${out.length} professeur(s)`, { domaine: 'finance' });
  return out;
}
