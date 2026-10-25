import { levelOf } from '../data/compute';

/** Niveau de compétence du préscolaire (A / EC / NA) à partir d'une moyenne /20. */
export function LevelPill({ v, long }: { v: number | null | undefined; long?: boolean }) {
  const l = levelOf(v);
  if (!l) return <span className="muted">-</span>;
  return <span className="lvl" title={l.label} style={{ background: l.bg, color: l.color }}>{long ? l.label : l.code}</span>;
}
