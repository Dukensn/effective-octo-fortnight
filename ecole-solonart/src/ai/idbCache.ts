// Cache des modèles dans IndexedDB (au lieu du Cache API par défaut de transformers.js).
// Implémente le contrat `match` / `put` attendu par `env.customCache`.
// Utilisable dans un Web Worker (IndexedDB y est disponible).

const DB = 'solonart-modeles';
const STORE = 'fichiers';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const r = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(r.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}

interface Entry { blob: Blob; type: string; savedAt: number }
type Progress = (d: { progress: number; loaded: number; total: number }) => void;
const keyOf = (req: RequestInfo | URL) => (typeof req === 'string' ? req : req instanceof URL ? req.href : req.url);

/** Lit une réponse en signalant la progression (fichiers de plusieurs centaines de Mo). */
async function readWithProgress(res: Response, onProgress?: Progress): Promise<Blob> {
  const total = Number(res.headers.get('content-length') ?? 0);
  if (!res.body) return res.blob();
  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress?.({ progress: total ? (loaded / total) * 100 : 0, loaded, total });
  }
  return new Blob(chunks);
}

export const idbModelCache = {
  async match(req: RequestInfo | URL): Promise<Response | undefined> {
    const e = await tx<Entry | undefined>('readonly', (s) => s.get(keyOf(req)) as IDBRequest<Entry | undefined>).catch(() => undefined);
    if (!e) return undefined;
    return new Response(e.blob, { headers: { 'content-type': e.type, 'content-length': String(e.blob.size) } });
  },
  async put(req: RequestInfo | URL, res: Response, onProgress?: Progress): Promise<void> {
    const blob = await readWithProgress(res, onProgress);
    const entry: Entry = { blob, type: res.headers.get('content-type') ?? 'application/octet-stream', savedAt: Date.now() };
    await tx('readwrite', (s) => s.put(entry, keyOf(req)));
  },
};

/** Taille occupée par les modèles téléchargés (octets) et nombre de fichiers. */
export async function cacheUsage(): Promise<{ bytes: number; files: number }> {
  const all = await tx<Entry[]>('readonly', (s) => s.getAll() as IDBRequest<Entry[]>).catch(() => [] as Entry[]);
  return { bytes: all.reduce((t, e) => t + (e.blob?.size ?? 0), 0), files: all.length };
}

/** Supprime tous les modèles téléchargés. */
export async function clearModelCache() {
  await tx('readwrite', (s) => s.clear());
}

/** Demande au navigateur de ne pas effacer les modèles en cas de manque d'espace. */
export async function requestPersistentStorage() {
  try { return await navigator.storage?.persist?.(); } catch { return false; }
}
