// Synchronisation avec Firebase Firestore (école en ligne ; jamais pour la démonstration).
//
// Principe :
//  1. L'application travaille TOUJOURS sur la base locale (IndexedDB) → fonctionne hors ligne.
//  2. Chaque modification locale est placée dans l'outbox (store.ts).
//  3. Quand la personne est connectée (Firebase Auth) et qu'il y a du réseau, l'outbox est envoyée par lots
//     dans Firestore : ecoles/{SCHOOL_ID}/{collection}/{id}
//  4. Les changements des autres appareils arrivent via onSnapshot et sont fusionnés en
//     "last-write-wins" grâce au champ updatedAt.
//  5. On n'écoute que ce que la personne a le droit de lire :
//     - compte sans rôle (demande en attente) ou parent : sa fiche, l'école et les rôles ;
//     - personnel (direction, secrétariat, professeurs…) : toute l'école.
//
// Le SDK Firebase est chargé dynamiquement : sans configuration, il n'est jamais téléchargé.
import { useSyncExternalStore } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { DocumentData, Firestore } from 'firebase/firestore';
import { db, outbox } from './store';
import { COLLECTIONS, type CollectionName, type User } from './types';
import { isDemo, onlineConfigured, SCHOOL_ID } from './mode';
import { userKey } from './skeleton';
import { logout } from '../lib/session';

export { SCHOOL_ID };
const env = import.meta.env;
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};
/** En ligne : Firebase est configuré ET on n'est pas dans la démonstration. */
export const firebaseEnabled = onlineConfigured && !isDemo;

export type SyncState = 'local' | 'offline' | 'syncing' | 'synced' | 'error';
let state: { status: SyncState; lastSync?: number; error?: string } = { status: firebaseEnabled ? 'offline' : 'local' };
const listeners = new Set<() => void>();
const setState = (s: Partial<typeof state>) => {
  state = { ...state, ...s };
  listeners.forEach((l) => l());
};
export function useSyncState() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  );
}

/** Une seule application Firebase, partagée avec lib/auth.ts. */
let appPromise: Promise<FirebaseApp> | null = null;
export function firebaseApp() {
  appPromise ??= import('firebase/app').then(({ getApps, initializeApp }) => getApps()[0] ?? initializeApp(firebaseConfig as Record<string, string>));
  return appPromise;
}

type FS = typeof import('firebase/firestore');
let fs: FS | null = null;
let firestore: Firestore | null = null;
let ready: Promise<void> | null = null;
let pushing = false;
/** Compte suivi (adresse e-mail) et ce qu'on écoute pour lui. */
let followed: string | null = null;
let level: 'aucun' | 'compte' | 'ecole' = 'aucun';
let unsubs: (() => void)[] = [];

const ref = (col: CollectionName, id?: string) => (id ? fs!.doc(firestore!, 'ecoles', SCHOOL_ID, col, id) : fs!.collection(firestore!, 'ecoles', SCHOOL_ID, col));

function apply(col: CollectionName, docs: DocumentData[]) {
  let changed = false;
  for (const d of docs) if (db.applyRemote(col, d as never)) changed = true;
  if (changed) db.commitRemote();
  setState({ status: navigator.onLine ? 'synced' : 'offline', lastSync: Date.now(), error: undefined });
  if (col === 'users' || col === 'roles') upgrade();
}
const fail = (err: Error) => setState({ status: 'error', error: err.message });

function listenCol(col: CollectionName) {
  unsubs.push(fs!.onSnapshot(fs!.collection(firestore!, 'ecoles', SCHOOL_ID, col), (snap) => apply(col, snap.docChanges().map((c) => c.doc.data())), fail));
}
function listenDoc(col: CollectionName, id: string) {
  unsubs.push(fs!.onSnapshot(fs!.doc(firestore!, 'ecoles', SCHOOL_ID, col, id), (d) => d.exists() && apply(col, [d.data()]), fail));
}
function stopAll() {
  unsubs.forEach((u) => u());
  unsubs = [];
  level = 'aucun';
}

/** Le personnel actif lit toute l'école ; sinon, seulement sa fiche, l'école et les rôles. */
function staffAccess(u: User | undefined) {
  const role = u?.roleId ? db.get('roles', u.roleId) : undefined;
  return !!u?.actif && !!role && role.espace !== 'parent';
}
function upgrade() {
  if (!followed) return;
  const staff = staffAccess(db.get('users', followed));
  if (staff && level === 'compte') {
    level = 'ecole';
    for (const col of COLLECTIONS) if (!['users', 'school', 'roles'].includes(col)) listenCol(col);
    listenCol('users');
  } else if (!staff && level === 'ecole') {
    // Rôle retiré ou compte désactivé : on revient au strict minimum.
    const email = followed;
    followed = null;
    follow(email);
  }
}

function follow(email: string | null) {
  if (email === followed && level !== 'aucun') return;
  stopAll();
  followed = email;
  if (!email) {
    // Plus de compte Firebase sur cet appareil : on ferme aussi la session de l'application.
    logout();
    setState({ status: navigator.onLine ? 'synced' : 'offline' });
    return;
  }
  level = 'compte';
  listenDoc('users', email);
  listenCol('school');
  listenCol('roles');
  void pushOutbox();
}

export function startSync() {
  if (!firebaseEnabled) return Promise.resolve();
  ready ??= (async () => {
    try {
      const [app, fsMod, authMod] = await Promise.all([firebaseApp(), import('firebase/firestore'), import('firebase/auth')]);
      fs = fsMod;
      // La base locale (IndexedDB) garde déjà tout hors ligne : le cache de Firestore reste en mémoire.
      firestore = fs.initializeFirestore(app, { localCache: fs.memoryLocalCache() });
      authMod.onAuthStateChanged(authMod.getAuth(app), (u) => follow(u?.email && u.emailVerified ? userKey(u.email) : null));
      window.addEventListener('online', () => pushOutbox());
      window.addEventListener('offline', () => setState({ status: 'offline' }));
      setInterval(pushOutbox, 15000);
    } catch (e) {
      fail(e as Error);
    }
  })();
  return ready;
}

/** Après la connexion : lit tout de suite la fiche du compte, son rôle et l'école (sans attendre l'écoute). */
export async function fetchAccount(email: string): Promise<User | undefined> {
  await startSync();
  if (!fs || !firestore) return undefined;
  const id = userKey(email);
  const read = async (col: CollectionName, docId: string) => {
    const d = await fs!.getDoc(ref(col, docId) as never);
    if (d.exists()) db.applyRemote(col, d.data() as never);
  };
  await read('users', id);
  const u = db.get('users', id);
  await Promise.all([read('school', 'main').catch(() => undefined), u?.roleId ? read('roles', u.roleId).catch(() => undefined) : undefined]);
  db.commitRemote();
  return db.get('users', id);
}

const refused = (e: unknown) => ['permission-denied', 'invalid-argument', 'failed-precondition'].includes((e as { code?: string }).code ?? '');
const plain = (col: CollectionName, id: string) => {
  const doc = db.raw(col)[id];
  return doc ? JSON.parse(JSON.stringify(doc)) : null;
};

/** Envoie les modifications locales par lots de 400 écritures.
 *  Si le serveur refuse un lot (droits, document trop lourd), on renvoie un par un et on écarte seulement ce qui est refusé. */
export async function pushOutbox() {
  if (!fs || !firestore || !followed || pushing || !navigator.onLine) return;
  const entries = Object.entries({ ...outbox });
  if (!entries.length) return setState({ status: 'synced', lastSync: Date.now() });
  pushing = true;
  setState({ status: 'syncing' });
  const rejected: string[] = [];
  try {
    for (let i = 0; i < entries.length; i += 400) {
      const chunk = entries.slice(i, i + 400);
      const batch = fs.writeBatch(firestore);
      for (const [, { col, id }] of chunk) {
        const doc = plain(col, id);
        if (doc) batch.set(ref(col, id) as never, doc);
      }
      try {
        await batch.commit();
      } catch (e) {
        if (!refused(e)) throw e;
        for (const [key, { col, id }] of chunk) {
          const doc = plain(col, id);
          if (!doc) continue;
          try { await fs.setDoc(ref(col, id) as never, doc); }
          catch (e2) { if (!refused(e2)) throw e2; rejected.push(key); }
        }
      }
      db.clearOutbox(chunk.map(([k]) => k));
    }
    setState(rejected.length
      ? { status: 'error', lastSync: Date.now(), error: `${rejected.length} modification${rejected.length > 1 ? 's' : ''} refusée${rejected.length > 1 ? 's' : ''} par le serveur (droits insuffisants ou fichier trop lourd) : ${rejected.slice(0, 3).join(', ')}` }
      : { status: 'synced', lastSync: Date.now(), error: undefined });
  } catch (e) {
    fail(e as Error);
  } finally {
    pushing = false;
  }
}
