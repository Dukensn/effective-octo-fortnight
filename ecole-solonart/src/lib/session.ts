// Session et permissions.
// En local : connexion par compte + code PIN. Avec Firebase : remplacer login() par signInWithEmailAndPassword
// et lier user.id à l'uid Firebase Auth (les règles Firestore lisent le rôle depuis /ecoles/{id}/users/{uid}).
import { useSyncExternalStore } from 'react';
import { db, useDoc } from '../data/store';
import type { Access, AuditLog, ModuleKey, User } from '../data/types';

const KEY = 'solonart:session';
let current: string | null = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
const ls = new Set<() => void>();

export function login(userId: string, pin: string): string | null {
  const u = db.get('users', userId);
  if (!u) return 'Compte introuvable';
  if (!u.actif) return 'Ce compte est désactivé. Contactez la direction.';
  if (u.pin !== pin) return 'Code incorrect';
  current = userId;
  try { localStorage.setItem(KEY, userId); } catch { /* navigation privée */ }
  db.patch('users', userId, { dernierAcces: Date.now() });
  audit(`Connexion`, u.nom, { domaine: 'acces' });
  ls.forEach((l) => l());
  return null;
}
/** Espace parent : connexion par numéro de téléphone + code (la liste des parents n'est jamais affichée). */
export function loginParent(tel: string, pin: string): string | null {
  const digits = (t?: string) => { const d = (t ?? '').replace(/\D/g, ''); return d.length === 8 ? `509${d}` : d; };
  const want = digits(tel);
  if (want.length < 8) return 'Entrez votre numéro de téléphone';
  const parentRoles = new Set(db.list('roles').filter((r) => r.espace === 'parent').map((r) => r.id));
  const u = db.list('users').find((x) => parentRoles.has(x.roleId) && digits(x.telephone) === want);
  if (!u) return 'Aucun accès parent pour ce numéro. Demandez votre code au secrétariat.';
  return login(u.id, pin);
}

export function logout() {
  current = null;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  ls.forEach((l) => l());
}
export function useSessionId() {
  return useSyncExternalStore((l) => (ls.add(l), () => ls.delete(l)), () => current);
}

export interface Session {
  user: User;
  role: NonNullable<ReturnType<typeof db.get<'roles'>>>;
  can: (m: ModuleKey, level?: Exclude<Access, 'none'>) => boolean;
  isTeacher: boolean;
  isParent: boolean;
}

export function useSession(): Session | null {
  const id = useSessionId();
  const user = useDoc('users', id ?? undefined);
  const role = useDoc('roles', user?.roleId);
  if (!user || !role || !user.actif) return null;
  return {
    user, role, isTeacher: role.espace === 'professeur', isParent: role.espace === 'parent',
    can: (m, level = 'read') => {
      const a = role.permissions[m] ?? 'none';
      return level === 'read' ? a !== 'none' : a === 'write';
    },
  };
}

/** Ajoute une ligne au journal. `extra` garde le domaine, le motif et les valeurs avant / après. */
export function audit(action: string, detail: string, extra: Pick<AuditLog, 'domaine' | 'motif' | 'changements'> = {}) {
  db.put('audit', { date: Date.now(), userId: current ?? undefined, action, detail, ...extra });
}
