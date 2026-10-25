// Deux façons d'utiliser l'application, sur le même site :
//  - « école » : la vraie école, en ligne (Firebase). Elle commence vide ; tous les téléphones partagent les données.
//  - « démo »  : une école fictive déjà remplie, seulement sur cet appareil. Elle n'est jamais envoyée en ligne
//                et on peut l'effacer à tout moment.
// Sans configuration Firebase (.env), il n'y a que la démo.
// Ce fichier ne dépend de rien d'autre : la base locale (store.ts) l'utilise pour séparer les deux.

const env = import.meta.env;
export const onlineConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID);
/** Nom affiché sur l'écran de connexion de l'école en ligne (avant connexion, la fiche de l'école n'est pas lisible). */
export const SCHOOL_NAME = (env.VITE_ECOLE_NOM as string | undefined) || '';
export const SCHOOL_ID = (env.VITE_FIREBASE_SCHOOL_ID as string | undefined) || 'solonart';

const KEY = 'solonart:mode';
const stored = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
export const isDemo = !onlineConfigured || stored === 'demo';

/** Préfixe des données de cet appareil : la démo et l'école ne se mélangent jamais. */
export const NS = isDemo ? 'solonart' : `ecole-${SCHOOL_ID}`;
export const DEMO_NS = 'solonart';

function restart() {
  location.hash = '#/';
  location.reload();
}
export function enterDemo() {
  try { localStorage.setItem(KEY, 'demo'); } catch { /* navigation privée */ }
  restart();
}
export function leaveDemo() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  restart();
}
