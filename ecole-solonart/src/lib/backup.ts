// Sauvegardes : une copie automatique par jour sur l'appareil (les 5 dernières, restaurables),
// et l'envoi du fichier hors de l'appareil (WhatsApp, Drive, email…) pour survivre à la perte du téléphone.
import { del, get, keys, set } from 'idb-keyval';
import { db } from '../data/store';
import { downloadBlob, todayISO } from './format';
import { NS } from '../data/mode';

const PREFIX = `${NS}:copie:`;
const KEEP = 5;
const LAST_EXPORT = 'solonart:dernier-envoi';

export async function autoSnapshot() {
  try {
    const key = PREFIX + todayISO();
    if (await get(key)) return;
    await set(key, db.exportJSON());
    const all = (await keys()).map(String).filter((k) => k.startsWith(PREFIX)).sort();
    for (const k of all.slice(0, Math.max(0, all.length - KEEP))) await del(k);
  } catch { /* stockage plein ou indisponible : on réessaiera demain */ }
}

export async function listSnapshots() {
  const all = (await keys()).map(String).filter((k) => k.startsWith(PREFIX)).sort().reverse();
  return Promise.all(all.map(async (k) => ({ date: k.slice(PREFIX.length), size: ((await get<string>(k)) ?? '').length })));
}

export async function restoreSnapshot(date: string) {
  const json = await get<string>(PREFIX + date);
  if (!json) throw new Error('Copie introuvable');
  await db.importJSON(json);
}

export const lastExport = () => { try { return Number(localStorage.getItem(LAST_EXPORT)) || 0; } catch { return 0; } };

/** Envoie la sauvegarde par le menu de partage du téléphone (WhatsApp, Drive…), sinon la télécharge. */
export async function shareBackup() {
  const name = `solonart-sauvegarde-${todayISO()}.json`;
  const file = new File([db.exportJSON()], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: 'Sauvegarde École' }); } catch (e) { if ((e as Error).name === 'AbortError') return false; throw e; }
  } else downloadBlob(name, file);
  try { localStorage.setItem(LAST_EXPORT, String(Date.now())); } catch { /* ignore */ }
  return true;
}
