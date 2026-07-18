import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Défilement automatique continu d'un rail horizontal (effet vitrine).
 * - Pause au survol / au toucher, et via `paused`
 * - Boucle sans couture si le contenu est rendu en double (reset à mi-course)
 * - Désactivé si l'utilisateur préfère réduire les animations
 */
export function useAutoScroll(
  ref: RefObject<HTMLElement | null>,
  opts?: { speed?: number; paused?: boolean },
) {
  const speed = opts?.speed ?? 0.5;
  const paused = opts?.paused ?? false;

  useEffect(() => {
    const el = ref.current;
    if (!el || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let hover = false;
    let acc = 0;
    let raf = 0;
    const onEnter = () => { hover = true; };
    const onLeave = () => { hover = false; };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('touchstart', onEnter, { passive: true });
    el.addEventListener('touchend', onLeave);

    const tick = () => {
      if (!hover) {
        acc += speed;
        if (acc >= 1) {
          const d = Math.floor(acc);
          acc -= d;
          const half = (el.scrollWidth - el.clientWidth > 0) ? el.scrollWidth / 2 : 0;
          el.scrollLeft += d;
          if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('touchstart', onEnter);
      el.removeEventListener('touchend', onLeave);
    };
  }, [ref, speed, paused]);
}
