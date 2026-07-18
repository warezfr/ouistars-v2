import './sepdune.css';

/**
 * Séparateurs « dunes sculptées » — cinq compositions distinctes, une par
 * jonction, pour que chaque passage de bloc ait sa propre respiration :
 *  - houle      : roulis classique, dérive vers la gauche
 *  - contre     : phase inversée, dérive vers la droite
 *  - croisee    : deux houles qui se croisent en X (dérives opposées)
 *  - diagonale  : dunes qui gravissent une pente vers la droite
 *  - pic        : un sommet décentré, étoile au zénith
 */

export type DuneVariant = 'houle' | 'contre' | 'croisee' | 'diagonale' | 'pic';

interface Layer { d: string; stops: [string, string, string]; fillOp: number; crest?: string; crestOp?: number; anim: 1 | 2 | 3; rev?: boolean }

const VARIANTS: Record<DuneVariant, { layers: Layer[]; star?: { x: number; y: number } }> = {
  houle: {
    layers: [
      { d: 'M0 68 C 300 32, 560 98, 860 62 S 1360 30, 1560 72', stops: ['#fdf3d0', '#e7cf8e', '#141007'], fillOp: 0.16, crest: '#fdf3d0', crestOp: 0.5, anim: 1 },
      { d: 'M0 96 C 340 62, 620 126, 920 92 S 1400 64, 1560 100', stops: ['#e7cf8e', '#c9a24b', '#0e0a04'], fillOp: 0.28, crest: '#e7cf8e', crestOp: 0.32, anim: 2 },
      { d: 'M0 126 C 380 98, 660 148, 980 122 S 1420 98, 1560 130', stops: ['#c9a24b', '#8f7126', '#0b0c10'], fillOp: 0.45, crest: '#c9a24b', crestOp: 0.28, anim: 3 },
    ],
  },
  contre: {
    layers: [
      { d: 'M0 60 C 260 100, 540 24, 880 76 S 1340 104, 1560 56', stops: ['#fdf3d0', '#e7cf8e', '#141007'], fillOp: 0.16, crest: '#fdf3d0', crestOp: 0.5, anim: 1, rev: true },
      { d: 'M0 92 C 300 128, 600 58, 940 104 S 1380 128, 1560 88', stops: ['#e7cf8e', '#c9a24b', '#0e0a04'], fillOp: 0.28, crest: '#e7cf8e', crestOp: 0.32, anim: 2, rev: true },
      { d: 'M0 124 C 340 150, 660 96, 1000 134 S 1420 146, 1560 120', stops: ['#c9a24b', '#8f7126', '#0b0c10'], fillOp: 0.45, crest: '#c9a24b', crestOp: 0.28, anim: 3, rev: true },
    ],
  },
  croisee: {
    layers: [
      { d: 'M0 52 C 420 34, 860 122, 1560 112', stops: ['#fdf3d0', '#e7cf8e', '#141007'], fillOp: 0.15, crest: '#fdf3d0', crestOp: 0.5, anim: 1 },
      { d: 'M0 116 C 420 132, 860 44, 1560 52', stops: ['#e7cf8e', '#c9a24b', '#0e0a04'], fillOp: 0.24, crest: '#e7cf8e', crestOp: 0.42, anim: 2, rev: true },
      { d: 'M0 134 C 500 124, 1040 140, 1560 130', stops: ['#c9a24b', '#8f7126', '#0b0c10'], fillOp: 0.42, crest: '#c9a24b', crestOp: 0.24, anim: 3 },
    ],
  },
  diagonale: {
    layers: [
      { d: 'M0 118 C 420 106, 920 72, 1560 28', stops: ['#fdf3d0', '#e7cf8e', '#141007'], fillOp: 0.14, crest: '#fdf3d0', crestOp: 0.48, anim: 1 },
      { d: 'M0 132 C 480 120, 1000 90, 1560 52', stops: ['#e7cf8e', '#c9a24b', '#0e0a04'], fillOp: 0.26, crest: '#e7cf8e', crestOp: 0.32, anim: 2, rev: true },
      { d: 'M0 144 C 520 136, 1060 110, 1560 76', stops: ['#c9a24b', '#8f7126', '#0b0c10'], fillOp: 0.44, crest: '#c9a24b', crestOp: 0.26, anim: 3 },
    ],
  },
  pic: {
    layers: [
      { d: 'M0 120 C 240 116, 360 36, 470 32 C 580 36, 720 118, 1560 122', stops: ['#fdf3d0', '#e7cf8e', '#141007'], fillOp: 0.16, crest: '#fdf3d0', crestOp: 0.55, anim: 1 },
      { d: 'M0 132 C 260 128, 380 72, 480 66 C 600 72, 780 132, 1560 134', stops: ['#e7cf8e', '#c9a24b', '#0e0a04'], fillOp: 0.26, crest: '#e7cf8e', crestOp: 0.34, anim: 2, rev: true },
      { d: 'M0 144 C 300 140, 520 120, 640 122 C 920 132, 1240 142, 1560 142', stops: ['#c9a24b', '#8f7126', '#0b0c10'], fillOp: 0.44, anim: 3 },
    ],
    star: { x: 470, y: 16 },
  },
};

export default function SepDune({ variant = 'houle' }: { variant?: DuneVariant }) {
  const v = VARIANTS[variant];
  return (
    <div className={`os-sepdune os-sepdune--${variant}`} aria-hidden>
      {v.layers.map((l, i) => (
        <svg
          key={i}
          className={`os-sepdune__l os-sepdune__a${l.anim}${l.rev ? ' os-sepdune__rev' : ''}`}
          viewBox="0 0 1560 150"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`osd-${variant}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={l.stops[0]} />
              <stop offset=".24" stopColor={l.stops[1]} />
              <stop offset="1" stopColor={l.stops[2]} />
            </linearGradient>
          </defs>
          <path d={`${l.d} L 1560 150 L 0 150 Z`} fill={`url(#osd-${variant}-${i})`} opacity={l.fillOp} />
          {l.crest && (
            <path d={l.d} fill="none" stroke={l.crest} strokeWidth={i === 0 ? 1.2 : 0.9}
              opacity={l.crestOp} className={i === 0 ? 'os-sepdune__crest' : undefined} />
          )}
        </svg>
      ))}
      {v.star && (
        <svg className="os-sepdune__l" viewBox="0 0 1560 150" preserveAspectRatio="none">
          <text x={v.star.x} y={v.star.y} fontSize="13" fill="#e7cf8e" textAnchor="middle" className="os-sepdune__star">✦</text>
        </svg>
      )}
    </div>
  );
}
