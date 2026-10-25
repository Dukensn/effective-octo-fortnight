// Session et permissions. La vérification du mot de passe ou du compte Google est dans lib/auth.ts.
import { useSyncExternalStore } from 'react';
import { db, useDoc } from '../data/store';
import type { Access, AuditLog, ModuleKey, User } from '../data/types';

const KEY = 'solonart:session';
let current: string | null = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
const ls = new Set<() => void>();

/** Ouvre la session d'un compte déjà vérifié (mot de passe ou Google, voir lib/auth.ts). */
export function signIn(userId: string): string | null {
  const u = db.get('users', userId);
  if (!u) return 'Compte introuvable';
  if (!u.actif) return 'Ce compte est désactivé. Contactez la direction.';
  current = userId;
  try { localStorage.setItem(KEY, userId); } catch { /* navigation privée */ }
  db.patch('users', userId, { dernierAcces: Date.now() });
  if (u.roleId) audit(`Connexion`, u.nom, { domaine: 'acces' });
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
  isParent: boolean;
}

/** Le compte connecté, même s'il n'a pas encore d'école (demande en attente). */
export function useAccount() {
  const id = useSessionId();
  return useDoc('users', id ?? undefined);
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
