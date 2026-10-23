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

export interface MonthlyReport {
  ym: string;
  recettes: number;
  nbPaiements: number;
  parMotif: [string, number][];
  parMode: [string, number][];
  salaires: number;
  salairesPayes: number;
  salairesEnAttente: number;
  depenses: number; // hors salaires
  parCategorie: [string, number][];
  detailDepenses: { date: string; libelle: string; categorie: string; montant: number }[];
  totalSorties: number;
  resultat: number;
  precedent: { recettes: number; totalSorties: number; resultat: number } | null;
  inscriptions: number;
  enAttente: number; // paiements à confirmer
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const group = <T,>(xs: T[], key: (x: T) => string, val: (x: T) => number) => {
  const m = new Map<string, number>();
  for (const x of xs) m.set(key(x), (m.get(key(x)) ?? 0) + val(x));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

function totalsFor(ym: string) {
  const pay = db.list('payments').filter((p) => p.statut === 'Payé' && p.date.startsWith(ym));
  const sal = db.list('salaries').filter((s) => s.periode === ym && s.statut === 'Payé');
  const exp = db.list('expenses').filter((e) => e.statut === 'Payé' && e.date.startsWith(ym));
  const recettes = sum(pay.map((p) => p.montant));
  const totalSorties = sum(sal.map((s) => s.montant + s.primes - s.retenues)) + sum(exp.map((e) => e.montant));
  return { pay, sal, exp, recettes, totalSorties, resultat: recettes - totalSorties };
}

/** Rapport financier d'un mois (« 2025-03 ») : recettes, sorties, résultat et comparaison au mois précédent. */
export function monthlyReport(ym: string): MonthlyReport {
  const t = totalsFor(ym);
  const [y, m] = ym.split('-').map(Number);
  const prevYm = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const p = totalsFor(prevYm);
  const allSal = db.list('salaries').filter((s) => s.periode === ym);
  return {
    ym,
    recettes: t.recettes,
    nbPaiements: t.pay.length,
    parMotif: group(t.pay, (x) => x.motif, (x) => x.montant),
    parMode: group(t.pay, (x) => x.mode, (x) => x.montant),
    salaires: sum(t.sal.map((s) => s.montant + s.primes - s.retenues)),
    salairesPayes: t.sal.length,
    salairesEnAttente: allSal.filter((s) => s.statut === 'En attente').length,
    depenses: sum(t.exp.map((e) => e.montant)),
    parCategorie: group(t.exp, (x) => x.categorie, (x) => x.montant),
    detailDepenses: t.exp.map((e) => ({ date: e.date, libelle: e.libelle, categorie: e.categorie, montant: e.montant })).sort((a, b) => a.date.localeCompare(b.date)),
    totalSorties: t.totalSorties,
    resultat: t.resultat,
    precedent: p.recettes || p.totalSorties ? { recettes: p.recettes, totalSorties: p.totalSorties, resultat: p.resultat } : null,
    inscriptions: db.list('students').filter((s) => s.dateInscription?.startsWith(ym)).length,
    enAttente: db.list('payments').filter((x) => x.statut === 'En attente' && x.date.startsWith(ym)).length,
  };
}

/** Mois ayant au moins un mouvement, du plus récent au plus ancien. */
export function activeMonths() {
  const s = new Set<string>();
  db.list('payments').forEach((p) => s.add(p.date.slice(0, 7)));
  db.list('expenses').forEach((e) => s.add(e.date.slice(0, 7)));
  db.list('salaries').forEach((x) => s.add(x.periode));
  return [...s].sort().reverse();
}
