import './sepdune.css';

/**
 * Séparateur « dune sculptée » (version légère) — trois strates de vagues
 * dorées en relief qui dérivent chacune à leur vitesse (parallaxe douce).
 * Opacités et hauteur contenues pour rester un accent, pas un décor.
 */
export default function SepDune() {
  return (
    <div className="os-sepdune" aria-hidden>
      <svg className="os-sepdune__l os-sepdune__l1" viewBox="0 0 1560 150" preserveAspectRatio="none">
        <defs>
          <linearGradient id="osd1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fdf3d0" /><stop offset=".22" stopColor="#e7cf8e" /><stop offset="1" stopColor="#141007" />
          </linearGradient>
        </defs>
        <path d="M0 68 C 300 32, 560 98, 860 62 S 1360 30, 1560 72 L 1560 150 L 0 150 Z" fill="url(#osd1)" opacity=".16" />
        <path d="M0 68 C 300 32, 560 98, 860 62 S 1360 30, 1560 72" fill="none" stroke="#fdf3d0" strokeWidth="1.2" opacity=".5" className="os-sepdune__crest" />
      </svg>
      <svg className="os-sepdune__l os-sepdune__l2" viewBox="0 0 1560 150" preserveAspectRatio="none">
        <defs>
          <linearGradient id="osd2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e7cf8e" /><stop offset=".26" stopColor="#c9a24b" /><stop offset="1" stopColor="#0e0a04" />
          </linearGradient>
        </defs>
        <path d="M0 96 C 340 62, 620 126, 920 92 S 1400 64, 1560 100 L 1560 150 L 0 150 Z" fill="url(#osd2)" opacity=".28" />
        <path d="M0 96 C 340 62, 620 126, 920 92 S 1400 64, 1560 100" fill="none" stroke="#e7cf8e" strokeWidth=".9" opacity=".32" />
      </svg>
      <svg className="os-sepdune__l os-sepdune__l3" viewBox="0 0 1560 150" preserveAspectRatio="none">
        <defs>
          <linearGradient id="osd3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9a24b" /><stop offset=".32" stopColor="#8f7126" /><stop offset="1" stopColor="#0b0c10" />
          </linearGradient>
        </defs>
        <path d="M0 126 C 380 98, 660 148, 980 122 S 1420 98, 1560 130 L 1560 150 L 0 150 Z" fill="url(#osd3)" opacity=".45" />
        <path d="M0 126 C 380 98, 660 148, 980 122 S 1420 98, 1560 130" fill="none" stroke="#c9a24b" strokeWidth=".8" opacity=".28" />
      </svg>
    </div>
  );
}
