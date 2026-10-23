// Session et permissions.
// En local : connexion par compte + code PIN. Avec Firebase : remplacer login() par signInWithEmailAndPassword
// et lier user.id à l'uid Firebase Auth (les règles Firestore lisent le rôle depuis /ecoles/{id}/users/{uid}).
import { useSyncExternalStore } from 'react';
import { db, useDoc } from '../data/store';
import type { Access, ModuleKey, User } from '../data/types';

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
  audit(`Connexion`, u.nom);
  ls.forEach((l) => l());
  return null;
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
}

export function useSession(): Session | null {
  const id = useSessionId();
  const user = useDoc('users', id ?? undefined);
  const role = useDoc('roles', user?.roleId);
  if (!user || !role || !user.actif) return null;
  return {
    user, role, isTeacher: role.espace === 'professeur',
    can: (m, level = 'read') => {
      const a = role.permissions[m] ?? 'none';
      return level === 'read' ? a !== 'none' : a === 'write';
    },
  };
}

export function audit(action: string, detail: string) {
  db.put('audit', { date: Date.now(), userId: current ?? undefined, action, detail });
}
