import { db } from '../data/store';
import type { ID, Student } from '../data/types';

/** Montant dû par un élève pour l'année (inscription + scolarité, bourse déduite). */
export function dueFor(s: Student) {
  const c = db.get('classes', s.classeId);
  if (!c) return 0;
  const scol = s.boursier ? c.fraisScolarite * (1 - (s.tauxBourse ?? 0) / 100) : c.fraisScolarite;
  return c.fraisInscription + scol;
}

export function paidBy(studentId: ID) {
  return db.list('payments').filter((p) => p.eleveId === studentId && p.statut === 'Payé' && (p.motif === 'Scolarité' || p.motif === 'Inscription')).reduce((a, p) => a + p.montant, 0);
}

let cacheKey: unknown[] = [];
let cache: Map<ID, { due: number; paid: number; rest: number }> | null = null;
/** Situation financière de tous les élèves actifs (mémorisée). */
export function balances() {
  const deps = [db.list('payments'), db.list('students'), db.list('classes')];
  if (cache && deps.every((d, i) => d === cacheKey[i])) return cache;
  const paid = new Map<ID, number>();
  for (const p of db.list('payments')) if (p.statut === 'Payé' && (p.motif === 'Scolarité' || p.motif === 'Inscription')) paid.set(p.eleveId, (paid.get(p.eleveId) ?? 0) + p.montant);
  cache = new Map();
  for (const s of db.list('students')) {
    if (s.statut !== 'Actif') continue;
    const due = dueFor(s);
    const pd = paid.get(s.id) ?? 0;
    cache.set(s.id, { due, paid: pd, rest: Math.max(0, due - pd) });
  }
  cacheKey = deps;
  return cache;
}

export function nextReceipt() {
  const y = new Date().getFullYear();
  const n = db.list('payments').length + 1;
  return `REC-${y}-${String(n).padStart(4, '0')}`;
}
