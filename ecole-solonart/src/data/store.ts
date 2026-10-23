// Base de données locale "offline-first".
// - Toutes les données vivent en mémoire et sont persistées dans IndexedDB (idb-keyval).
// - Chaque écriture met à jour `updatedAt` et ajoute le document à la file d'attente (outbox)
//   qui sera envoyée à Firebase dès qu'une connexion est disponible (voir sync.ts).
// - Les composants React s'abonnent via useCollection / useDoc.
import { get, set, del } from 'idb-keyval';
import { useSyncExternalStore } from 'react';
import { COLLECTIONS, type CollectionName, type Collections, type ID } from './types';

type Table<K extends CollectionName> = Record<ID, Collections[K]>;
type Data = { [K in CollectionName]: Table<K> };

const DB_KEY = (c: string) => `solonart:${c}`;
const OUTBOX_KEY = 'solonart:outbox';
const SCHEMA_KEY = 'solonart:schema';
export const SCHEMA_VERSION = 9;

const data = Object.fromEntries(COLLECTIONS.map((c) => [c, {}])) as unknown as Data;
const versions = Object.fromEntries(COLLECTIONS.map((c) => [c, 0])) as Record<CollectionName, number>;
const listCache = new Map<CollectionName, { v: number; list: unknown[] }>();
const listeners = new Set<() => void>();
let globalVersion = 0;

/** File d'attente des documents modifiés localement et pas encore envoyés au serveur. */
export let outbox: Record<string, { col: CollectionName; id: ID }> = {};

const dirty = new Set<CollectionName>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  globalVersion++;
  listeners.forEach((l) => l());
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 250);
}

async function flush() {
  const cols = [...dirty];
  dirty.clear();
  await Promise.all(cols.map((c) => set(DB_KEY(c), data[c])));
  await set(OUTBOX_KEY, outbox);
}

function touch(col: CollectionName) {
  versions[col]++;
  dirty.add(col);
  scheduleSave();
  emit();
}

export function uid(prefix = ''): ID {
  const r = crypto.getRandomValues(new Uint32Array(2));
  return prefix + Date.now().toString(36) + r[0].toString(36) + r[1].toString(36).slice(0, 4);
}

export const db = {
  list<K extends CollectionName>(col: K): Collections[K][] {
    const c = listCache.get(col);
    if (c && c.v === versions[col]) return c.list as Collections[K][];
    const list = Object.values(data[col]).filter((d) => !d.deleted) as Collections[K][];
    listCache.set(col, { v: versions[col], list });
    return list;
  },
  get<K extends CollectionName>(col: K, id: ID | undefined): Collections[K] | undefined {
    if (!id) return undefined;
    const d = data[col][id];
    return d && !d.deleted ? d : undefined;
  },
  put<K extends CollectionName>(col: K, doc: Omit<Collections[K], 'id' | 'updatedAt'> & { id?: ID; updatedAt?: number }): Collections[K] {
    const id = doc.id ?? uid();
    const full = { ...doc, id, updatedAt: Date.now() } as Collections[K];
    (data[col] as Table<K>)[id] = full;
    outbox[`${col}/${id}`] = { col, id };
    touch(col);
    return full;
  },
  bulkPut<K extends CollectionName>(col: K, docs: (Omit<Collections[K], 'id' | 'updatedAt'> & { id?: ID })[]) {
    const now = Date.now();
    for (const doc of docs) {
      const id = doc.id ?? uid();
      (data[col] as Table<K>)[id] = { ...doc, id, updatedAt: now } as Collections[K];
      outbox[`${col}/${id}`] = { col, id };
    }
    touch(col);
  },
  patch<K extends CollectionName>(col: K, id: ID, partial: Partial<Collections[K]>) {
    const cur = data[col][id];
    if (!cur) return;
    (data[col] as Table<K>)[id] = { ...cur, ...partial, id, updatedAt: Date.now() } as Collections[K];
    outbox[`${col}/${id}`] = { col, id };
    touch(col);
  },
  remove(col: CollectionName, id: ID) {
    const cur = data[col][id];
    if (!cur) return;
    (data[col] as Record<ID, unknown>)[id] = { ...cur, deleted: true, updatedAt: Date.now() };
    outbox[`${col}/${id}`] = { col, id };
    touch(col);
  },
  /** Applique un document venu du serveur (ne repasse pas par l'outbox). */
  applyRemote<K extends CollectionName>(col: K, doc: Collections[K]) {
    const cur = data[col][doc.id];
    if (cur && cur.updatedAt >= doc.updatedAt) return false;
    (data[col] as Table<K>)[doc.id] = doc;
    versions[col]++;
    dirty.add(col);
    return true;
  },
  commitRemote() {
    scheduleSave();
    emit();
  },
  raw(col: CollectionName) {
    return data[col];
  },
  clearOutbox(keys: string[]) {
    keys.forEach((k) => delete outbox[k]);
    set(OUTBOX_KEY, outbox);
    emit();
  },
  pendingCount() {
    return Object.keys(outbox).length;
  },
  exportJSON(): string {
    return JSON.stringify({ schema: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data }, null, 1);
  },
  async importJSON(json: string) {
    const parsed = JSON.parse(json);
    if (!parsed?.data) throw new Error('Fichier de sauvegarde invalide');
    for (const c of COLLECTIONS) {
      (data as Record<string, unknown>)[c] = parsed.data[c] ?? {};
      versions[c]++;
      dirty.add(c);
      for (const id of Object.keys(data[c])) outbox[`${c}/${id}`] = { col: c, id };
    }
    await flush();
    emit();
  },
  async reset() {
    for (const c of COLLECTIONS) {
      await del(DB_KEY(c));
      (data as Record<string, unknown>)[c] = {};
      versions[c]++;
    }
    outbox = {};
    await del(OUTBOX_KEY);
    await del(SCHEMA_KEY);
  },
};

export async function loadDatabase(seed: () => void) {
  const schema = await get(SCHEMA_KEY);
  if (schema === SCHEMA_VERSION) {
    const tables = await Promise.all(COLLECTIONS.map((c) => get(DB_KEY(c))));
    COLLECTIONS.forEach((c, i) => {
      (data as Record<string, unknown>)[c] = tables[i] ?? {};
      versions[c]++;
    });
    outbox = (await get(OUTBOX_KEY)) ?? {};
  }
  if (Object.keys(data.school).length === 0) {
    seed();
    await flush();
    await set(SCHEMA_KEY, SCHEMA_VERSION);
  }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCollection<K extends CollectionName>(col: K): Collections[K][] {
  return useSyncExternalStore(subscribe, () => db.list(col));
}

export function useDoc<K extends CollectionName>(col: K, id: ID | undefined): Collections[K] | undefined {
  return useSyncExternalStore(subscribe, () => db.get(col, id));
}

export function useDbVersion() {
  return useSyncExternalStore(subscribe, () => globalVersion);
}
