const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/** 12450000 -> "12,450,000 G" (format utilisé dans les maquettes) */
export const money = (n: number, cur = 'G') => `${Math.round(n).toLocaleString('en-US')} ${cur}`;
export const moneyShort = (n: number) => (Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.0', '')}M` : Math.abs(n) >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

const parse = (d: string | number | Date) => (typeof d === 'string' && d.length === 10 ? new Date(d + 'T12:00:00') : new Date(d));
export const dateShort = (d?: string | number) => {
  if (!d) return '-';
  const x = parse(d);
  return `${x.getDate()} ${MOIS[x.getMonth()]} ${x.getFullYear()}`;
};
export const dateLong = (d?: string | number) => {
  if (!d) return '-';
  const x = parse(d);
  return `${x.getDate() === 1 ? '1er' : x.getDate()} ${MOIS_LONG[x.getMonth()]} ${x.getFullYear()}`;
};
export const dateFull = (d: Date = new Date()) => `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS_LONG[d.getMonth()]} ${d.getFullYear()}`;
export const dayMonth = (d: string) => { const x = parse(d); return `${x.getDate()} ${MOIS[x.getMonth()]}`; };
export const monthLabel = (ym: string) => { const [y, m] = ym.split('-').map(Number); return `${MOIS_LONG[m - 1][0].toUpperCase()}${MOIS_LONG[m - 1].slice(1)} ${y}`; };
export const monthShort = (m: number) => MOIS[m - 1].replace('.', '');
export const timeAgo = (t: number) => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return dateShort(t);
};
export const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
export const age = (dob?: string) => { if (!dob) return 0; const d = parse(dob); const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
export const fullName = (p?: { prenom: string; nom: string }) => (p ? `${p.prenom} ${p.nom}` : '');
export const civ = (p?: { sexe: 'M' | 'F'; prenom: string; nom: string }) => (p ? `${p.sexe === 'F' ? 'Mme' : 'M.'} ${p.prenom} ${p.nom}` : '');
export const initials = (s: string) => s.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const ordinal = (n: number) => (n === 1 ? '1er' : `${n}e`);

/** Export CSV compatible Excel (UTF-8 avec BOM, séparateur ;) */
export function downloadCSV(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows.map((r) => r.map((c) => { const v = c ?? ''; const s = String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(';')).join('\r\n');
  downloadBlob(filename, new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
}
export function downloadBlob(filename: string, blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function readFileAsDataURL(file: File, maxSize = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      if (!file.type.startsWith('image/')) return resolve(r.result as string);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, maxSize / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86));
      };
      img.onerror = reject;
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}
