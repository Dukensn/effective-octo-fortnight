import { Children, cloneElement, createContext, Fragment, isValidElement, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Inbox, MoreHorizontal, MoreVertical, X, AlertCircle, Search } from 'lucide-react';
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
/** Fait défiler une rangée horizontale pour que l'élément actif soit visible. */
export const scrollIntoRow = (el: HTMLElement | null) => {
  const row = el?.parentElement;
  if (!el || !row || row.scrollWidth <= row.clientWidth) return;
  row.scrollLeft = Math.max(0, el.offsetLeft - row.offsetLeft - 14);
};
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: (T | [T, string])[]; value: T; onChange: (v: T) => void }) {
  const phone = useIsMobile();
  const [open, setOpen] = useState(false);
  const items = tabs.map((t) => (Array.isArray(t) ? t : [t, t]) as [T, string]);
  // Téléphone : au-delà de 4 onglets, un sélecteur plutôt qu'une rangée à faire glisser.
  if (phone && items.length > 4) {
    const current = items.find(([k]) => k === value)?.[1] ?? '';
    return (
      <>
        <div className="tabs tabs-picker">
          <button className="tab-select" onClick={() => setOpen(true)} aria-haspopup="dialog"><span className="grow ellipsis">{current}</span><ChevronDown size={18} /></button>
        </div>
        <Sheet open={open} onClose={() => setOpen(false)}>
          <div className="sheet-list">
            {items.map(([k, label]) => (
              <button key={k} className={`sheet-row ${k === value ? 'selected' : ''}`} onClick={() => { setOpen(false); onChange(k); }}>
                <span className="grow">{label}</span>{k === value && <Check size={18} />}
              </button>
            ))}
          </div>
        </Sheet>
      </>
    );
  }
  return (
    <div className={`tabs ${phone ? 'tabs-seg' : ''}`} role="tablist">
      {items.map(([k, label]) => <button key={k} role="tab" className={value === k ? 'active' : ''} ref={value === k ? scrollIntoRow : undefined} onClick={() => onChange(k)}>{label}</button>)}
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

// ---------------- Feuille du bas (mobile) ----------------
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        {title && <div className="sheet-title">{title}</div>}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Emplacements de la barre d'application mobile, remplis par PageHead. */
export const AppBarCtx = createContext<{ title: HTMLElement | null; actions: HTMLElement | null }>({ title: null, actions: null });

/** Transforme les actions d'en-tête (boutons, menus) en lignes de feuille d'actions. */
function sheetRows(node: ReactNode, close: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  Children.toArray(node).forEach((ch, i) => {
    if (!isValidElement(ch)) return;
    const el = ch as ReactElement<{ children?: ReactNode; items?: Parameters<typeof Menu>[0]['items']; className?: string; onClick?: () => void }>;
    if (el.type === Fragment) { out.push(...sheetRows(el.props.children, close)); return; }
    if (el.type === Menu) {
      el.props.items!.forEach((it, j) => out.push(it === 'sep' ? <hr key={`${i}-${j}`} /> : (
        <button key={`${i}-${j}`} className={`sheet-row ${it.danger ? 'danger' : ''}`} onClick={() => { close(); it.onClick(); }}>{it.icon}{it.label}</button>
      )));
      return;
    }
    if (el.type === 'button') {
      const primary = el.props.className?.includes('btn-primary');
      out.push(cloneElement(el, { key: i, className: `sheet-row ${primary ? 'primary' : ''}`, onClick: () => { close(); el.props.onClick?.(); } }));
      return;
    }
    out.push(<div key={i} className="sheet-other">{el}</div>);
  });
  // l'action principale en premier
  return out.sort((x, y) => Number(isValidElement(y) && String((y.props as { className?: string }).className).includes('primary')) - Number(isValidElement(x) && String((x.props as { className?: string }).className).includes('primary')));
}

function AppBarActions({ actions, title }: { actions: ReactNode; title: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="icon-btn" aria-label="Actions" onClick={() => setOpen(true)}><MoreVertical /></button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <div className="sheet-list">{sheetRows(actions, () => setOpen(false))}</div>
      </Sheet>
    </>
  );
}

/** En-tête d'écran secondaire (retour + titre). Sur téléphone, le titre monte dans la barre d'application. */
export function ScreenHead({ title, sub, right, menu, onBack, center }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; menu?: ReactNode; onBack: () => void; center?: boolean }) {
  const bar = useContext(AppBarCtx);
  const desktop = useIsDesktop();
  if (!desktop && bar.title) {
    return (
      <>
        {createPortal(title, bar.title)}
        {menu && bar.actions && createPortal(menu, bar.actions)}
        {(sub || right) && <div className="row mb-12 screen-sub">{sub && <div className="grow muted small">{sub}</div>}{right}</div>}
      </>
    );
  }
  return (
    <div className="row mb-16" style={{ alignItems: sub ? 'flex-start' : 'center' }}>
      <button className="icon-btn" onClick={onBack} aria-label="Retour"><ArrowLeft /></button>
      {center ? <h2 className="grow center" style={{ fontSize: 18 }}>{title}</h2> : <div className="grow"><h2 style={{ fontSize: 19 }}>{title}</h2>{sub && <div className="muted">{sub}</div>}</div>}
      {right ?? (center && <span style={{ width: 40 }} />)}
      {menu}
    </div>
  );
}

export function PageHead({ title, sub, actions, back }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  const bar = useContext(AppBarCtx);
  const desktop = useIsDesktop();
  // Sur téléphone et tablette : le titre va dans la barre d'application, les actions dans une feuille.
  if (!desktop && bar.title) {
    return (
      <>
        {createPortal(title, bar.title)}
        {actions && bar.actions && createPortal(<AppBarActions actions={actions} title={title} />, bar.actions)}
      </>
    );
  }
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
