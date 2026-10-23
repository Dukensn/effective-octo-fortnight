// Moment fort : petite gerbe d'étincelles à l'endroit touché (règle pic-fin : on se souvient de ce moment).
import { toast } from '../components/ui';
import { dayItems } from './prof';
import { checkOf, validateCourse } from './paie';
import type { DayItem } from './prof';
import type { ID } from '../data/types';

const COLORS = ['#1463f3', '#17a34a', '#f0a500', '#e2557a', '#8b5cf6'];

export function celebrate(x: number, y: number) {
  if (typeof document === 'undefined') return;
  const root = document.createElement('div');
  root.className = 'spark-root';
  root.style.left = `${x}px`;
  root.style.top = `${y}px`;
  for (let i = 0; i < 14; i++) {
    const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const d = 36 + Math.random() * 36;
    const s = document.createElement('i');
    s.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    s.style.background = COLORS[i % COLORS.length];
    root.appendChild(s);
  }
  document.body.appendChild(root);
  setTimeout(() => root.remove(), 900);
  navigator.vibrate?.(25);
}

/** « Cours donné » avec un retour qui fait plaisir : étincelles + où on en est dans la journée. */
export function giveCourse(it: DayItem, date: string, staffId: ID, userId: ID, at?: { clientX: number; clientY: number }) {
  if (!validateCourse(it, date, staffId, userId)) return;
  if (at) celebrate(at.clientX, at.clientY);
  const school = dayItems(staffId, date).filter((x) => x.kind !== 'externe' && x.slot);
  const done = school.filter((x) => checkOf(date, x.slot!.id)?.statut === 'valide').length;
  toast(done >= school.length ? `Journée complète : ${done} cours donnés. Bravo !` : `Bravo ! ${done} cours donné${done > 1 ? 's' : ''} sur ${school.length} aujourd’hui`);
}
