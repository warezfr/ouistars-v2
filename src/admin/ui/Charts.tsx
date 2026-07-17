/** Graphiques légers en SVG (sans dépendance), compatibles thème clair/sombre. */

const GOLD = '#c9a227';
const PALETTE = ['#c9a227', '#4e79a7', '#59a14f', '#b07aa1', '#e15759', '#76b7b2', '#9c755f'];

/** Courbe d'aire — évolution (ex. CA / réservations sur 30 jours). */
export function AreaChart({ points, labels, height = 150, unit = '' }: {
  points: number[]; labels?: string[]; height?: number; unit?: string;
}) {
  const w = 640, h = height, pad = 8;
  const max = Math.max(1, ...points);
  const n = points.length;
  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, n - 1);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const line = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(n - 1).toFixed(1)} ${h - pad} L ${x(0).toFixed(1)} ${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaG)" />
      <path d={line} fill="none" stroke={GOLD} strokeWidth="2" strokeLinejoin="round" />
      {points.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill={GOLD}>
          <title>{labels?.[i] ?? `J${i + 1}`} : {v}{unit}</title>
        </circle>
      ))}
    </svg>
  );
}

/** Barres verticales. */
export function BarChart({ data, height = 160, unit = '' }: {
  data: { label: string; value: number }[]; height?: number; unit?: string;
}) {
  const w = 640, h = height, pad = 22;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (w - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img">
      {data.map((d, i) => {
        const bh = (d.value / max) * (h - pad * 2);
        const x = pad + i * bw;
        return (
          <g key={d.label}>
            <rect x={x + bw * 0.18} y={h - pad - bh} width={bw * 0.64} height={bh} rx="3" fill={PALETTE[i % PALETTE.length]}>
              <title>{d.label} : {d.value}{unit}</title>
            </rect>
            <text x={x + bw / 2} y={h - 6} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{d.label}</text>
            <text x={x + bw / 2} y={h - pad - bh - 4} textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="600">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Anneau (donut) + légende — répartition (statuts, canaux…). */
export function DonutChart({ data, size = 160 }: { data: { label: string; value: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2, ir = r * 0.6;
  let a0 = -Math.PI / 2;
  const arc = (val: number, i: number) => {
    const a1 = a0 + (val / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (ang: number, rad: number) => [r + rad * Math.cos(ang), r + rad * Math.sin(ang)];
    const [x0, y0] = p(a0, r), [x1, y1] = p(a1, r), [x2, y2] = p(a1, ir), [x3, y3] = p(a0, ir);
    a0 = a1;
    return <path key={i} d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${ir} ${ir} 0 ${large} 0 ${x3} ${y3} Z`}
      fill={PALETTE[i % PALETTE.length]}><title>{data[i].label} : {data[i].value}</title></path>;
  };
  return (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img">
        {data.map((d, i) => arc(d.value, i))}
        <text x={r} y={r - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor">{total}</text>
        <text x={r} y={r + 14} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.6">TOTAL</text>
      </svg>
      <div className="small">
        {data.map((d, i) => (
          <div key={d.label} className="d-flex align-items-center gap-2 mb-1">
            <span style={{ width: 11, height: 11, borderRadius: 3, background: PALETTE[i % PALETTE.length], display: 'inline-block' }} />
            <span>{d.label}</span>
            <strong className="ms-auto">{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
