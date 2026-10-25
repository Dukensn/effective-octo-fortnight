import { db } from '../data/store';
import { COMITE_ROLES, type ClassRoom, type ID } from '../data/types';

/** Accord du rôle (Président → Présidente…) selon le sexe de l'élève. */
export function roleLabel(role: string, sexe?: 'M' | 'F') {
  if (sexe !== 'F') return role;
  return ({ Président: 'Présidente', 'Vice-président': 'Vice-présidente', Trésorier: 'Trésorière', Conseiller: 'Conseillère' } as Record<string, string>)[role] ?? role;
}

export const roleOrder = (role: string) => { const i = COMITE_ROLES.indexOf(role); return i < 0 ? 99 : i; };

/** Au secondaire, seul un élève peut être responsable. */
export const allowsTeacherResponsable = (c: Pick<ClassRoom, 'niveau'>) => c.niveau !== 'Secondaire';

/** Responsable effectif : celui choisi, sinon le président (secondaire) ou le titulaire (autres niveaux). */
export function responsableOf(c: ClassRoom): { type: 'eleve' | 'professeur'; id: ID } | null {
  if (c.responsable && (c.responsable.type === 'eleve' || allowsTeacherResponsable(c))) return c.responsable;
  const pres = c.comite?.find((m) => m.role === 'Président');
  if (!allowsTeacherResponsable(c)) return pres ? { type: 'eleve', id: pres.eleveId } : null;
  return c.titulaireId ? { type: 'professeur', id: c.titulaireId } : pres ? { type: 'eleve', id: pres.eleveId } : null;
}

/** Rôles d'un élève dans le comité de sa classe. */
export function studentRoles(eleveId: ID) {
  const s = db.get('students', eleveId);
  const c = s && db.get('classes', s.classeId);
  if (!c) return [];
  const roles = (c.comite ?? []).filter((m) => m.eleveId === eleveId).map((m) => roleLabel(m.role, s.sexe));
  const r = responsableOf(c);
  if (r?.type === 'eleve' && r.id === eleveId) roles.unshift(s.sexe === 'F' ? 'Responsable de classe' : 'Responsable de classe');
  return roles;
}
