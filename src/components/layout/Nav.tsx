import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { MAIN_NAV } from '@/data/services';
import { useSingleton } from '@/lib/cms';
import './nav.css';

interface Props { onBook: () => void; }

/** Liens du menu — Fashion Weeks retiré (accessible via la section Événements). */
const NAV_LINKS = MAIN_NAV.filter((n) => n.id !== 'fashion');

export default function Nav({ onBook }: Props) {
  const { lang, t, setLang } = useI18n();
  const settings = useSingleton('settings', { logo: '/logo-ouistars.png', brandName: 'OUISTARS' });
  const brand = (settings.brandName as string) || 'OUISTARS';
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
          <img className="os-nav__logo" src={(settings.logo as string) || '/logo-ouistars.png'} alt="" width={38} height={38} />
          {brand.slice(0, 3)}<span>{brand.slice(3)}</span>
        </a>

        <nav className={`os-nav__links${open ? ' is-open' : ''}`} aria-label="Navigation principale">
          {NAV_LINKS.map((item) => (
            <a key={item.id} href={item.href} onClick={() => setOpen(false)}>
              {lang === 'fr' ? item.fr : item.en}
            </a>
          ))}
          <div className="os-nav__mobile-cta">
            <button className="os-btn os-btn--gold" onClick={() => { setOpen(false); onBook(); }}>{t.cta.book}</button>
          </div>
        </nav>

        <div className="os-nav__actions">
          <button className="os-nav__lang" onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} aria-label="Language">{t.nav.lang}</button>
          <button className="os-btn os-btn--gold os-nav__book" onClick={onBook}>{t.cta.book}</button>
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
