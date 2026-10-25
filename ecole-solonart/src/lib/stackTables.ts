// Sur téléphone, un tableau plus large que l'écran devient une liste de fiches
// (« étiquette : valeur ») pour ne jamais faire glisser l'écran de gauche à droite.

function prepare(table: HTMLTableElement) {
  const wrap = table.closest('.table-wrap') as HTMLElement | null;
  if (!wrap || table.classList.contains('stacked')) return;
  const headRows = table.tHead?.rows;
  if (!headRows?.length || headRows.length > 1) return; // en-têtes sur 2 lignes : on laisse tel quel
  if (table.scrollWidth <= wrap.clientWidth + 2) return;
  const labels = [...headRows[0].cells].map((th) => th.textContent?.trim() ?? '');
  for (const tr of table.tBodies[0]?.rows ?? []) {
    let col = 0;
    for (const td of tr.cells) {
      td.setAttribute('data-label', labels[col] ?? '');
      col += td.colSpan || 1;
    }
  }
  table.classList.add('stacked');
}

function label(table: HTMLTableElement) {
  // lignes ajoutées après coup (pagination, filtres) : leur donner aussi les étiquettes
  const labels = [...(table.tHead?.rows[0]?.cells ?? [])].map((th) => th.textContent?.trim() ?? '');
  for (const tr of table.tBodies[0]?.rows ?? []) {
    let col = 0;
    for (const td of tr.cells) {
      if (!td.hasAttribute('data-label')) td.setAttribute('data-label', labels[col] ?? '');
      col += td.colSpan || 1;
    }
  }
}

/** Observe un conteneur et empile les tableaux trop larges. Renvoie la fonction d'arrêt. */
export function watchTables(root: HTMLElement) {
  let raf = 0;
  const run = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      root.querySelectorAll<HTMLTableElement>('.table-wrap table').forEach((t) => {
        if (t.classList.contains('stacked')) label(t);
        else prepare(t);
      });
    });
  };
  run();
  const mo = new MutationObserver(run);
  mo.observe(root, { childList: true, subtree: true });
  return () => { mo.disconnect(); cancelAnimationFrame(raf); };
}
