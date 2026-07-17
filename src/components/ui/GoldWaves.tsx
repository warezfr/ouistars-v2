/**
 * Fond ondulé « or champagne » — SVG fixé derrière tout le contenu.
 * Très discret (opacités 0.04–0.08), animé lentement, sans interaction.
 * Monté une seule fois dans HomePage.
 */
export default function GoldWaves() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          className="os-wave-1"
          d="M-120 620 C 240 520, 500 760, 840 640 S 1380 520, 1680 660"
          stroke="#c9a24b"
          strokeWidth="1.4"
          opacity="0.08"
        />
        <path
          className="os-wave-2"
          d="M-120 730 C 300 650, 560 870, 900 750 S 1420 650, 1680 790"
          stroke="#e3c988"
          strokeWidth="1"
          opacity="0.05"
        />
        <path
          className="os-wave-3"
          d="M-120 250 C 280 170, 640 360, 1000 240 S 1460 150, 1680 290"
          stroke="#c9a24b"
          strokeWidth="1.2"
          opacity="0.04"
        />
      </svg>
    </div>
  );
}
