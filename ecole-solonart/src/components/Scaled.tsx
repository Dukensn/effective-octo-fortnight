import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Affiche un document de taille fixe (px) réduit pour tenir dans la largeur disponible. */
export function Scaled({ width, height, children, max = 1 }: { width: number; height: number; children: ReactNode; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(max, el.clientWidth / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, max]);
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <div style={{ width: width * scale, height: height * scale, margin: '0 auto', position: 'relative' }}>
        <div className="scale-box" style={{ width, height, transform: `scale(${scale})`, position: 'absolute', left: 0, top: 0 }}>{children}</div>
      </div>
    </div>
  );
}

export const A4L = { w: 1123, h: 794 };
export const A4P = { w: 794, h: 1123 };
