import { useEffect, useRef, useState } from 'react';
import { useI18n, LANGS } from '@/i18n';
import { MAIN_NAV } from '@/data/services';
import { useSingleton } from '@/lib/cms';
import BlogDrawer from '@/components/blog/BlogDrawer';
import './nav.css';

interface Props { onBook: () => void; }

/** Liens du menu — Fashion Weeks retiré (accessible via la section Événements). */
const NAV_LINKS = MAIN_NAV.filter((n) => n.id !== 'fashion');

/** Code pays ISO pour le drapeau de chaque langue (flagcdn — SVG). */
const FLAG_CC: Record<string, string> = { fr: 'fr', en: 'gb', es: 'es', ru: 'ru', ar: 'sa' };
const Flag = ({ code, className }: { code: string; className?: string }) => (
  <img className={className} src={`https://flagcdn.com/${FLAG_CC[code] ?? 'fr'}.svg`}
    alt="" width={22} height={15} loading="lazy" />
);

export default function Nav({ onBook }: Props) {
  const { lang, t, setLang } = useI18n();
  const settings = useSingleton('settings', { logo: '/logo-ouistars.png', brandName: 'OUISTARS' });
  const brand = (settings.brandName as string) || 'OUISTARS';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Fermeture du menu langue au clic/toucher hors du menu (fiable sur mobile,
  // contrairement à mouseleave qui refermait le menu avant le clic).
  useEffect(() => {
    if (!langOpen) return;
    const close = (e: PointerEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [langOpen]);

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
              {item[lang]}
            </a>
          ))}
          <div className="os-nav__mobile-cta">
            <button className="os-btn os-btn--gold" onClick={() => { setOpen(false); onBook(); }}>{t.cta.book}</button>
          </div>
        </nav>

        <div className="os-nav__actions">
          <button className="os-nav__blog" onClick={() => setBlogOpen(true)}
            aria-label="Our Blog" title="Our Blog">
            <span className="os-nav__blog-pip" aria-hidden />Our Blog
          </button>
          <div className="os-nav__langwrap" ref={langRef}>
            <button className="os-nav__lang os-nav__lang--flag" onClick={() => setLangOpen((v) => !v)}
              aria-label="Language" aria-haspopup="listbox" aria-expanded={langOpen}>
              <Flag code={lang} className="os-nav__flag" /><span>{lang.toUpperCase()}</span>
            </button>
            {langOpen && (
              <ul className="os-nav__langmenu" role="listbox" aria-label="Language">
                {LANGS.map((l) => (
                  <li key={l.code}>
                    <button role="option" aria-selected={l.code === lang}
                      className={l.code === lang ? 'is-now' : ''}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}>
                      <Flag code={l.code} className="os-nav__flag" />{l.label}
                      <em>{l.code.toUpperCase()}</em>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
      <BlogDrawer open={blogOpen} onClose={() => setBlogOpen(false)} />
    </header>
  );
}
