import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { MAIN_NAV } from '@/data/services';
import './nav.css';

interface Props { onBook: () => void; onQuote: () => void; }

export default function Nav({ onBook, onQuote }: Props) {
  const { lang, t, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Verrouille le scroll de la page quand le menu mobile est ouvert.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className={`os-nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-menu-open' : ''}`}>
      <div className="os-nav__inner os-container">
        <a href="#top" className="os-nav__brand" onClick={() => setOpen(false)}>
          OUI<span>STARS</span>
        </a>

        <nav className={`os-nav__links${open ? ' is-open' : ''}`} aria-label="Navigation principale">
          {MAIN_NAV.map((item) => (
            <a key={item.id} href={item.href} onClick={() => setOpen(false)}>
              {lang === 'fr' ? item.fr : item.en}
            </a>
          ))}
          <div className="os-nav__mobile-cta">
            <button className="os-btn os-btn--ghost" onClick={() => { setOpen(false); onQuote(); }}>{t.nav.quote}</button>
            <button className="os-btn os-btn--gold" onClick={() => { setOpen(false); onBook(); }}>{t.nav.book}</button>
          </div>
        </nav>

        <div className="os-nav__actions">
          <button className="os-nav__lang" onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} aria-label="Language">{t.nav.lang}</button>
          <button className="os-btn os-btn--ghost os-nav__quote" onClick={onQuote}>{t.nav.quote}</button>
          <button className="os-btn os-btn--gold os-nav__book" onClick={onBook}>{t.nav.book}</button>
          <button
            className={`os-nav__burger${open ? ' is-active' : ''}`}
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
