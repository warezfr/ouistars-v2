import { useEffect, useState } from 'react';
import './scrollnav.css';

/**
 * Navigation de défilement :
 *  - flèches ↑/↓ (à droite, mi-hauteur) pour passer de section en section
 *  - flèche « retour en haut » qui apparaît après un premier défilement
 */
export default function ScrollNav() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sections = (): HTMLElement[] =>
    Array.from(document.querySelectorAll<HTMLElement>('main section[id], footer#contact'));

  /** Saute à la section précédente (-1) ou suivante (+1). */
  const jump = (dir: -1 | 1) => {
    const els = sections();
    if (!els.length) return;
    const probe = window.scrollY + window.innerHeight * 0.3;
    let current = 0;
    els.forEach((el, i) => { if (el.offsetTop <= probe) current = i; });
    const target = els[Math.min(els.length - 1, Math.max(0, current + dir))];
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="os-scrollnav" aria-hidden={false}>
        <button type="button" className="os-scrollnav__btn" onClick={() => jump(-1)} aria-label="Section précédente">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
        </button>
        <span className="os-scrollnav__rule" aria-hidden />
        <button type="button" className="os-scrollnav__btn" onClick={() => jump(1)} aria-label="Section suivante">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </div>

      <button type="button" className={`os-totop${showTop ? ' is-visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Revenir en haut">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 11l7-7 7 7" /><path d="M5 19l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
