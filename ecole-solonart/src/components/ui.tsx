import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Inbox, MoreHorizontal, X, AlertCircle, Search } from 'lucide-react';
import { initials } from '../lib/format';

// ---------------- Avatar ----------------
const AV_COLORS = ['#e3edff:#1463f3', '#e5f7ec:#17a34a', '#fff1dc:#c77700', '#f1ebff:#7c4ddb', '#ffe6ee:#d63d6b', '#dcf5f6:#0b8f8f'];
export function Avatar({ src, name, size = 36, square }: { src?: string; name: string; size?: number; square?: boolean }) {
  const [err, setErr] = useState(false);
  if (src && !err)
    return <img className={`avatar${square ? ' sq' : ''}`} src={src} alt={name} width={size} height={size} style={{ width: size, height: size }} onError={() => setErr(true)} loading="lazy" />;
  const [bg, fg] = AV_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length].split(':');
  return (
    <span className={`avatar${square ? ' sq' : ''}`} style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38 }} aria-label={name}>
      {initials(name)}
    </span>
  );
}

// ---------------- Badge ----------------
export type BadgeTone = 'green' | 'blue' | 'orange' | 'red' | 'gray' | 'violet';
export function Badge({ tone = 'blue', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`badge b-${tone}`}>{children}</span>;
}
export const statusTone = (s: string): BadgeTone =>
  ({ Actif: 'green', Payé: 'green', Clôturé: 'green', Présent: 'green', Terminé: 'green', 'En cours': 'blue', Planifié: 'blue', Nouveau: 'green', 'À venir': 'gray', 'En attente': 'orange', Retard: 'orange', Congé: 'violet', Inactif: 'orange', Excusé: 'violet', Absent: 'red', Annulé: 'red', Suspendu: 'red', Archivé: 'gray', Transféré: 'gray' } as Record<string, BadgeTone>)[s] ?? 'blue';
export const StatusBadge = ({ s }: { s: string }) => <Badge tone={statusTone(s)}>{s}</Badge>;

// ---------------- Modal ----------------
export function Modal({ open, onClose, title, children, footer, size }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'lg' | 'xl' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ?? ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Confirm({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmer', danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><button className="btn" onClick={onClose}>Annuler</button><button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button></>}>
      <p className="muted">{message}</p>
    </Modal>
  );
}

// ---------------- Toasts ----------------
let toasts: { id: number; msg: string; error?: boolean }[] = [];
const tl = new Set<() => void>();
export function toast(msg: string, error = false) {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, msg, error }];
  tl.forEach((l) => l());
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); tl.forEach((l) => l()); }, 3200);
}
export function Toasts() {
  const list = useSyncExternalStore((l) => (tl.add(l), () => tl.delete(l)), () => toasts);
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast ${t.error ? 'error' : ''}`}>{t.error ? <AlertCircle /> : <CheckCircle2 />}{t.msg}</div>
      ))}
    </div>
  );
}

// ---------------- Tabs ----------------
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: (T | [T, string])[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => {
        const [k, label] = Array.isArray(t) ? t : [t, t];
        return <button key={k} role="tab" className={value === k ? 'active' : ''} onClick={() => onChange(k)}>{label}</button>;
      })}
    </div>
  );
}
export function Pills<T extends string>({ items, value, onChange }: { items: (T | [T, string])[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="pills">
      {items.map((t) => {
        const [k, label] = Array.isArray(t) ? t : [t, t];
        return <button key={k} className={value === k ? 'active' : ''} onClick={() => onChange(k)}>{label}</button>;
      })}
    </div>
  );
}

// ---------------- Form fields ----------------
export function Field({ label, req, opt, children, className }: { label: string; req?: boolean; opt?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={`field ${className ?? ''}`}>
      <span>{label}{req && <span className="req"> *</span>}{opt && <span className="opt"> (optionnel)</span>}</span>
      {children}
    </label>
  );
}
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="search">
      <Search />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? 'Rechercher...'} />
    </div>
  );
}
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <button type="button" className={`toggle ${on ? 'on' : ''}`} aria-pressed={on} aria-label={label} onClick={() => onChange(!on)} />;
}

// ---------------- Menu ----------------
export function Menu({ items, trigger }: { items: ({ label: string; icon?: ReactNode; onClick: () => void; danger?: boolean } | 'sep')[]; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="menu-wrap" ref={ref} onClick={(e) => e.stopPropagation()}>
      {trigger ? <span onClick={() => setOpen(!open)}>{trigger}</span> : <button className="more-btn" aria-label="Actions" onClick={() => setOpen(!open)}><MoreHorizontal /></button>}
      {open && (
        <div className="menu">
          {items.map((it, i) => it === 'sep' ? <hr key={i} /> : (
            <button key={i} style={it.danger ? { color: 'var(--red)' } : undefined} onClick={() => { setOpen(false); it.onClick(); }}>{it.icon}{it.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Pagination ----------------
export function usePaged<T>(list: T[], perPage = 10) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const p = Math.min(page, pages);
  return { page: p, pages, setPage, items: list.slice((p - 1) * perPage, p * perPage), total: list.length, perPage };
}
export function Pager({ page, pages, setPage, total, perPage, onPerPage }: { page: number; pages: number; setPage: (n: number) => void; total: number; perPage: number; onPerPage?: (n: number) => void }) {
  if (total === 0) return null;
  const nums: (number | '…')[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1 || (page <= 3 && i <= 4)) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  return (
    <div className="pager">
      <button onClick={() => setPage(Math.max(1, page - 1))} aria-label="Précédent"><ChevronLeft size={16} /></button>
      {nums.map((n, i) => n === '…' ? <span key={i} className="muted">…</span> : <button key={i} className={n === page ? 'active' : ''} onClick={() => setPage(n)}>{n}</button>)}
      <button onClick={() => setPage(Math.min(pages, page + 1))} aria-label="Suivant"><ChevronRight size={16} /></button>
      <span className="grow" />
      {onPerPage && (
        <select className="select" style={{ width: 130, height: 36 }} value={perPage} onChange={(e) => onPerPage(Number(e.target.value))}>
          {[10, 25, 50].map((n) => <option key={n} value={n}>{n} par page</option>)}
        </select>
      )}
      <span className="small muted">{(page - 1) * perPage + 1} – {Math.min(total, page * perPage)} sur {total}</span>
    </div>
  );
}

export function Empty({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="empty">
      {icon ?? <Inbox />}
      <div className="bold" style={{ color: 'var(--ink)' }}>{title}</div>
      {children && <div className="small mt-8">{children}</div>}
    </div>
  );
}

export function PageHead({ title, sub, actions, back }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="page-head">
      <div className="titles">
        {back}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon, tint, value, label, sub }: { icon: ReactNode; tint: string; value: ReactNode; label: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card stat">
      <div className={`ic tint-${tint}`}>{icon}</div>
      <div className="grow">
        <div className="v">{value}</div>
        <div className="l">{label}</div>
        {sub && <div className="s">{sub}</div>}
      </div>
    </div>
  );
}

export function Card({ title, link, onLink, children, className, pad = true, actions }: { title?: ReactNode; link?: string; onLink?: () => void; children: ReactNode; className?: string; pad?: boolean; actions?: ReactNode }) {
  return (
    <div className={`card ${className ?? ''}`}>
      {title && (
        <div className="card-head">
          <h3>{title}</h3>
          {actions}
          {link && <button className="btn-ghost link" style={{ border: 0, background: 'none', color: 'var(--primary)' }} onClick={onLink}>{link}</button>}
        </div>
      )}
      <div className={pad ? (title ? 'card-pad' : 'card-pad') : ''} style={title && pad ? { paddingTop: 4 } : undefined}>{children}</div>
    </div>
  );
}

export function useMedia(q: string) {
  return useSyncExternalStore(
    (l) => { const m = window.matchMedia(q); m.addEventListener('change', l); return () => m.removeEventListener('change', l); },
    () => window.matchMedia(q).matches,
  );
}
export const useIsDesktop = () => useMedia('(min-width: 1024px)');
export const useIsMobile = () => useMedia('(max-width: 767px)');
