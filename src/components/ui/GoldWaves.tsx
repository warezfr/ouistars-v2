import { useEffect, useRef } from 'react';

/**
 * Fond « or vivant » — fixé derrière tout le contenu :
 *  - ondulations dorées animées (plus présentes qu'avant, avec halo)
 *  - poussière d'or scintillante
 *  - interactif : parallaxe douce au mouvement de la souris (lerp rAF)
 *    + halo doré qui suit le curseur. Désactivé si prefers-reduced-motion.
 * Monté une seule fois dans HomePage.
 */

/** Particules déterministes (pas de Math.random → rendu stable). */
const DUST = Array.from({ length: 26 }, (_, i) => {
  const x = ((i * 197) % 1440);
  const y = ((i * 353) % 860) + 20;
  const r = 1 + ((i * 7) % 3) * 0.55;
  const dur = 4 + ((i * 13) % 7);
  const delay = (i * 0.7) % 6;
  return { x, y, r, dur, delay };
});

export default function GoldWaves() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return; // tactile : pas de parallaxe

    let tx = 0, ty = 0;   // cible (position souris normalisée -1..1)
    let cx = 0, cy = 0;   // valeur lissée
    let gx = 50, gy = 40; // halo (en %)
    let tgx = 50, tgy = 40;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      tgx = (e.clientX / window.innerWidth) * 100;
      tgy = (e.clientY / window.innerHeight) * 100;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const tick = () => {
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      gx += (tgx - gx) * 0.06;
      gy += (tgy - gy) * 0.06;
      el.style.setProperty('--wx', cx.toFixed(4));
      el.style.setProperty('--wy', cy.toFixed(4));
      el.style.setProperty('--gx', `${gx.toFixed(2)}%`);
      el.style.setProperty('--gy', `${gy.toFixed(2)}%`);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden className="os-waves pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Halo doré qui suit le curseur */}
      <div className="os-waves__glow" />

      {/* Couche arrière — dérive lente, parallaxe faible */}
      <svg className="os-waves__layer os-waves__layer--back" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
        <path className="os-wave-3" d="M-120 250 C 280 170, 640 360, 1000 240 S 1460 150, 1680 290" stroke="#c9a24b" strokeWidth="1.4" opacity="0.12" />
        <path className="os-wave-2" d="M-120 380 C 320 300, 620 470, 980 370 S 1440 300, 1680 420" stroke="#e3c988" strokeWidth="1" opacity="0.08" />
        {DUST.slice(0, 13).map((p, i) => (
          <circle key={i} className="os-dust" cx={p.x} cy={p.y} r={p.r}
            fill="#e3c988" style={{ animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />
        ))}
      </svg>

      {/* Couche avant — plus marquée, parallaxe plus forte, halo doux */}
      <svg className="os-waves__layer os-waves__layer--front" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
        <path className="os-wave-1" d="M-120 620 C 240 520, 500 760, 840 640 S 1380 520, 1680 660" stroke="#c9a24b" strokeWidth="1.8" opacity="0.2" />
        <path className="os-wave-2" d="M-120 700 C 300 620, 560 830, 900 720 S 1420 620, 1680 760" stroke="#e3c988" strokeWidth="1.2" opacity="0.13" />
        <path className="os-wave-3" d="M-120 800 C 340 740, 620 900, 980 810 S 1440 740, 1680 860" stroke="#a17e2f" strokeWidth="1" opacity="0.1" />
        {DUST.slice(13).map((p, i) => (
          <circle key={i} className="os-dust" cx={p.x} cy={(p.y + 380) % 880} r={p.r}
            fill="#c9a24b" style={{ animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />
        ))}
      </svg>
    </div>
  );
}
