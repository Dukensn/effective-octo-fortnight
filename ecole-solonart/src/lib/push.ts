// Notifications système (barre du téléphone) : nouveaux messages, appel à faire, remplacement…
// Elles s'affichent quand l'application est ouverte ou en arrière-plan. Application fermée : il faudra
// l'envoi depuis le serveur (Firebase Cloud Messaging) une fois la synchronisation en ligne branchée.
import { useEffect, useRef } from 'react';
import type { Notif } from './notifications';

const KEY = 'solonart:notif-systeme';
export const pushSupported = () => typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
export const pushEnabled = () => { try { return pushSupported() && Notification.permission === 'granted' && localStorage.getItem(KEY) === '1'; } catch { return false; } };

export async function enablePush(on: boolean) {
  if (!on) { try { localStorage.setItem(KEY, '0'); } catch { /* ignore */ } return false; }
  if (!pushSupported()) throw new Error('Ce navigateur ne permet pas les notifications');
  const p = await Notification.requestPermission();
  if (p !== 'granted') throw new Error('Notifications refusées : autorisez-les dans les réglages du navigateur');
  try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
  await show('Notifications activées', 'Vous serez prévenu ici des nouveaux messages et alertes.', '/');
  return true;
}

export async function show(title: string, body: string, to: string) {
  const reg = await navigator.serviceWorker.getRegistration();
  const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: title, data: { url: `${location.pathname}#${to}` } };
  if (reg) await reg.showNotification(title, opts);
  else new Notification(title, opts);
}

/** Affiche une notification système quand un compteur de la cloche augmente. */
export function useSystemNotifications(notifs: Notif[]) {
  const prev = useRef<Map<string, number> | null>(null);
  useEffect(() => {
    const now = new Map(notifs.map((n) => [n.label, n.n]));
    if (prev.current && pushEnabled()) {
      for (const n of notifs) if (n.n > (prev.current.get(n.label) ?? 0)) void show(n.label, n.sub, n.to);
    }
    prev.current = now;
  }, [notifs]);
}
