// Petits éléments communs aux écrans mobiles de l'administration :
// barre de recherche avec filtres dépliables, liste en carte, ligne de liste.
import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { SearchInput, useIsMobile } from './ui';

/** Recherche + bouton « Filtres » (un point bleu quand un filtre est actif) ; les filtres se déplient dessous. */
export function MToolbar({ q, onQ, placeholder, active, filters }: { q: string; onQ: (v: string) => void; placeholder: string; active?: boolean; filters?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="m-search">
        <SearchInput value={q} onChange={onQ} placeholder={placeholder} />
        {filters && <button className={`m-filter-btn${open || active ? ' on' : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}><SlidersHorizontal size={16} />Filtres{active && !open && <i className="dot" />}</button>}
      </div>
      {open && filters && <div className="m-filter-panel">{filters}</div>}
    </>
  );
}

/** Un groupe de choix dans le panneau de filtres. */
export function MChoices<T extends string>({ title, value, options, onChange }: { title: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div>
      <h4 className="mb-8">{title}</h4>
      <div className="chip-wrap">{options.map(([k, l]) => <button key={k} className={`chip ${value === k ? 'active' : ''}`} onClick={() => onChange(k)}>{l}</button>)}</div>
    </div>
  );
}

/** Une ligne : élément de tête (photo ou icône), titre, sous-titre, fin (valeur ou flèche). */
export function MRow({ lead, title, sub, end, onClick }: { lead?: ReactNode; title: ReactNode; sub?: ReactNode; end?: ReactNode; onClick?: () => void }) {
  const body = <>{lead}<span className="grow"><b>{title}</b>{sub && <small>{sub}</small>}</span>{end ?? (onClick && <ChevronRight size={18} className="chev" />)}</>;
  return onClick ? <button className="row-item" onClick={onClick}>{body}</button> : <div className="row-item">{body}</div>;
}

export const MIcon = ({ children, tint }: { children: ReactNode; tint?: string }) => <span className={`row-ic${tint ? ` tint-${tint}` : ''}`}>{children}</span>;

/** Filtres repliés sur téléphone : un bouton « Filtres » (point bleu si un filtre est actif) qui déplie le contenu. Sur grand écran, rien ne change. */
export function FiltersFold({ active, summary, children }: { active?: boolean; summary?: ReactNode; children: ReactNode }) {
  const phone = useIsMobile();
  const [open, setOpen] = useState(false);
  if (!phone) return <>{children}</>;
  return (
    <div className="fold">
      <button className={`m-filter-btn fold-btn${open || active ? ' on' : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <SlidersHorizontal size={16} /><span className="grow ellipsis">{summary ?? 'Filtres'}</span>{active && !open && <i className="dot" />}<ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: '.2s' }} />
      </button>
      {open && <div className="fold-body">{children}</div>}
    </div>
  );
}
