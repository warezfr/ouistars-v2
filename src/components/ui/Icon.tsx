/** Petites icônes linéaires inline (stroke) pour les services. */
const PATHS: Record<string, string> = {
  car: 'M3 13l2-5a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 5v5h-3m-15 0H3v-5m3 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm12 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  fleet: 'M3 17h4l1-3h8l1 3h4M6 14V9h12v5M9 6h6',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  plane: 'M10 4l10 8-10 8-1-6-6-2 6-2 1-6z',
  star: 'M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.3l6-.8L12 3z',
  sparkle: 'M12 3v6m0 6v6m-9-9h6m6 0h6M6 6l3 3m6 6l3 3M18 6l-3 3M9 15l-3 3',
  briefcase: 'M4 8h16v11H4V8zm5-3h6v3H9V5zM4 13h16',
  jet: 'M2 14l8-2 4-8 2 1-2 7 6 3-1 2-7-2-2 4-6-1 1-3z',
  building: 'M5 21V5l7-2 7 2v16M9 9h2m4 0h2M9 13h2m4 0h2M9 17h2m4 0h2',
  shield: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2zm4 4a2 2 0 0 0 4 0',
};

export default function Icon({ name, size = 26 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name] ?? PATHS.star} />
    </svg>
  );
}
