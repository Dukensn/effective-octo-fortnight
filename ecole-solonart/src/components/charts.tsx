// Graphiques SVG légers (sans dépendance), lisibles à l'écran comme à l'impression.

export interface Series { label: string; color: string; values: (number | null)[] }

export function BarChart({ labels, series, line, height = 220, max, ticks = 5, format = (n: number) => String(n), showValues, barWidth, width = 640 }: {
  labels: string[]; series: Series[]; line?: Series; height?: number; max?: number; ticks?: number; format?: (n: number) => string; showValues?: boolean; barWidth?: number; width?: number;
}) {
  const W = width;
  const H = height;
  const padL = 40, padB = 26, padT = showValues ? 20 : 10, padR = 8;
  const all = [...series.flatMap((s) => s.values), ...(line?.values ?? [])].filter((v): v is number => v !== null);
  const top = max ?? niceMax(Math.max(1, ...all));
  const gw = (W - padL - padR) / labels.length;
  const bw = barWidth ?? Math.min(18, (gw * 0.7) / series.length);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" style={{ display: 'block', overflow: 'visible' }}>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const v = (top / ticks) * i;
        return (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#e9eef6" />
            <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6b7690">{format(v)}</text>
          </g>
        );
      })}
      {labels.map((l, i) => {
        const cx = padL + gw * i + gw / 2;
        const start = cx - (bw * series.length + 3 * (series.length - 1)) / 2;
        return (
          <g key={l + i}>
            {series.map((s, si) => {
              const v = s.values[i];
              if (v === null || v === undefined) return null;
              const x = start + si * (bw + 3);
              return (
                <g key={si}>
                  <rect x={x} y={y(v)} width={bw} height={Math.max(0, H - padB - y(v))} rx={Math.min(3, bw / 3)} fill={s.color} />
                  {showValues && <text x={x + bw / 2} y={y(v) - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f2a44">{format(v)}</text>}
                </g>
              );
            })}
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="11.5" fill="#4b5672">{l}</text>
          </g>
        );
      })}
      {line && (
        <g>
          <polyline fill="none" stroke={line.color} strokeWidth="2" points={line.values.map((v, i) => (v === null ? '' : `${padL + gw * i + gw / 2},${y(v)}`)).join(' ')} />
          {line.values.map((v, i) => v !== null && <circle key={i} cx={padL + gw * i + gw / 2} cy={y(v)} r="3.5" fill="#fff" stroke={line.color} strokeWidth="2" />)}
        </g>
      )}
    </svg>
  );
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10) * p;
}

export function Donut({ parts, size = 180, thickness = 30, center }: { parts: { label: string; value: number; color: string }[]; size?: number; thickness?: number; center?: React.ReactNode }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {parts.map((p) => {
          const len = (p.value / total) * c;
          const el = <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={thickness} strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-off} />;
          off += len;
          return el;
        })}
      </svg>
      {center && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{center}</div>}
    </div>
  );
}

export function Sparkline({ values, color = '#1463f3', width = 120, height = 32 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const mn = Math.min(...values), mx = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 3 - ((v - mn) / (mx - mn || 1)) * (height - 6)}`).join(' ');
  return <svg width={width} height={height}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" /></svg>;
}
