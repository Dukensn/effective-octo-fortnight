// Impression / export PDF : rend les documents dans une zone dédiée puis ouvre la boîte d'impression
// du navigateur (choisir « Enregistrer au format PDF » pour obtenir un PDF).
import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

let content: ReactNode = null;
const ls = new Set<() => void>();
const emit = () => ls.forEach((l) => l());

export type PageFormat = 'A4 landscape' | 'A4 portrait';

export async function printDocument(node: ReactNode, format: PageFormat = 'A4 landscape', title?: string) {
  content = node;
  emit();
  const style = document.createElement('style');
  style.textContent = `@page { size: ${format}; margin: 0; }`;
  document.head.appendChild(style);
  document.body.classList.add('printing');
  const prevTitle = document.title;
  if (title) document.title = title;
  await new Promise((r) => setTimeout(r, 60));
  const imgs = [...document.querySelectorAll<HTMLImageElement>('.print-root img')];
  await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; }))));
  await new Promise((r) => setTimeout(r, 250));
  const done = () => {
    document.body.classList.remove('printing');
    style.remove();
    document.title = prevTitle;
    content = null;
    emit();
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
  // Certains navigateurs mobiles ne déclenchent pas afterprint
  setTimeout(() => document.body.classList.contains('printing') && done(), 60000);
}

export function PrintRoot() {
  const node = useSyncExternalStore((l) => (ls.add(l), () => ls.delete(l)), () => content);
  return createPortal(<div className="print-root">{node}</div>, document.body);
}
