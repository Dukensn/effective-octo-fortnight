// Synchronisation avec Firebase Firestore (optionnelle).
//
// Principe :
//  1. L'application travaille TOUJOURS sur la base locale (IndexedDB) → fonctionne hors ligne.
//  2. Chaque modification locale est placée dans l'outbox (store.ts).
//  3. Si Firebase est configuré (.env.local) et qu'il y a du réseau, l'outbox est envoyée par lots
//     dans Firestore : ecoles/{SCHOOL_ID}/{collection}/{id}
//  4. Les changements des autres appareils (professeur ↔ administration) arrivent via onSnapshot
//     et sont fusionnés en "last-write-wins" grâce au champ updatedAt.
//
// Le SDK Firebase est chargé dynamiquement : sans configuration, il n'est jamais téléchargé.
import { useSyncExternalStore } from 'react';
import { db, outbox } from './store';
import { COLLECTIONS, type CollectionName } from './types';

const env = import.meta.env;
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};
export const SCHOOL_ID = (env.VITE_FIREBASE_SCHOOL_ID as string | undefined) || 'solonart';
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

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

type FS = typeof import('firebase/firestore');
let fs: FS | null = null;
let firestore: import('firebase/firestore').Firestore | null = null;
let pushing = false;

export async function startSync() {
  if (!firebaseEnabled) return;
  try {
    const [{ initializeApp }, firestoreMod] = await Promise.all([import('firebase/app'), import('firebase/firestore')]);
    fs = firestoreMod;
    const app = initializeApp(firebaseConfig as Record<string, string>);
    firestore = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache() });
    // Écoute temps réel de chaque collection
    for (const col of COLLECTIONS) {
      const ref = fs.collection(firestore, 'ecoles', SCHOOL_ID, col);
      fs.onSnapshot(ref, { includeMetadataChanges: false }, (snap) => {
        let changed = false;
        snap.docChanges().forEach((ch) => {
          const doc = ch.doc.data() as never;
          if (db.applyRemote(col as CollectionName, doc)) changed = true;
        });
        if (changed) db.commitRemote();
        setState({ status: navigator.onLine ? 'synced' : 'offline', lastSync: Date.now() });
      }, (err) => setState({ status: 'error', error: err.message }));
    }
    window.addEventListener('online', () => pushOutbox());
    window.addEventListener('offline', () => setState({ status: 'offline' }));
    setInterval(pushOutbox, 15000);
    await pushOutbox();
  } catch (e) {
    setState({ status: 'error', error: (e as Error).message });
  }
}

/** Envoie les modifications locales par lots de 400 écritures. */
export async function pushOutbox() {
  if (!fs || !firestore || pushing || !navigator.onLine) return;
  const entries = Object.entries({ ...outbox });
  if (!entries.length) return setState({ status: 'synced', lastSync: Date.now() });
  pushing = true;
  setState({ status: 'syncing' });
  try {
    for (let i = 0; i < entries.length; i += 400) {
      const chunk = entries.slice(i, i + 400);
      const batch = fs.writeBatch(firestore);
      for (const [, { col, id }] of chunk) {
        const doc = db.raw(col)[id];
        if (doc) batch.set(fs.doc(firestore, 'ecoles', SCHOOL_ID, col, id), JSON.parse(JSON.stringify(doc)));
      }
      await batch.commit();
      db.clearOutbox(chunk.map(([k]) => k));
    }
    setState({ status: 'synced', lastSync: Date.now(), error: undefined });
  } catch (e) {
    setState({ status: 'error', error: (e as Error).message });
  } finally {
    pushing = false;
  }
}
