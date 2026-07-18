import { useI18n } from '@/i18n';
import { MAIN_NAV } from '@/data/services';
import { useSingleton } from '@/lib/cms';
import './footer.css';

interface Props { onJoin: () => void; }

/** Colophon de maison — bande d'invitation, registre de liens, signature
    monumentale en contour or, ligne légale. */
export default function Footer({ onJoin }: Props) {
  const { lang, t } = useI18n();
  const st = useSingleton('settings', {
    email: 'info@ouistars.com', whatsapp: '33651030306', phone: '+33 6 51 03 03 06',
    address: '', tagline: '', brandName: 'OUISTARS',
  });
  const brand = (st.brandName as string) || 'OUISTARS';
  const year = 2026;

  return (
    <footer className="os-footer" id="contact">
      {/* Bande d'invitation — la dernière question de la maison */}
      <div className="os-container os-footer__call">
        <div>
          <p className="os-eyebrow">{lang === 'fr' ? 'Votre prochain trajet' : 'Your next journey'}</p>
          <h3 className="os-footer__calltitle">
            {lang === 'fr' ? 'Où pouvons-nous vous conduire ?' : 'Where may we take you?'}
          </h3>
        </div>
        <div className="os-footer__callactions">
          <a className="os-btn os-btn--gold" href={`https://wa.me/${st.whatsapp}`} target="_blank" rel="noreferrer">
            {lang === 'fr' ? 'Conciergerie 24/7' : 'Concierge 24/7'}
          </a>
          <button className="os-btn os-btn--ghost" onClick={onJoin}>{t.nav.join}</button>
        </div>
      </div>

      {/* Registre — quatre colonnes en filets or */}
      <div className="os-container os-footer__ledger">
        <div className="os-footer__col os-footer__col--brand">
          <div className="os-footer__brand">
            <img src="/logo-ouistars.png" alt="" className="os-footer__logo" loading="lazy" />
            <span className="os-footer__brandtext">{brand.slice(0, 3)}<span>{brand.slice(3)}</span></span>
          </div>
          <p className="os-footer__tag">{(st.tagline as string) || t.footer.tagline}</p>
          <p className="os-footer__addr">{(st.address as string) || t.footer.address}</p>
        </div>

        <div className="os-footer__col">
          <h4>{lang === 'fr' ? 'Explorer' : 'Explore'}</h4>
          <ul className="os-footer__links os-footer__links--2col">
            {MAIN_NAV.filter((n) => n.id !== 'contact').map((n) => (
              <li key={n.id}><a href={n.href}>{lang === 'fr' ? n.fr : n.en}</a></li>
            ))}
          </ul>
        </div>

        <div className="os-footer__col">
          <h4>Services</h4>
          <ul className="os-footer__links">
            <li><a href="#tarifs">{t.footer.pricingLink}</a></li>
            <li><a href="#meet-greet">{t.footer.meetGreetLink}</a></li>
            <li><a href="#corporate">Corporate & Institutions</a></li>
            <li><a href="#dmc-band">Destination Management</a></li>
          </ul>
        </div>

        <div className="os-footer__col">
          <h4>{t.footer.contact}</h4>
          <ul className="os-footer__links">
            <li><a href={`mailto:${st.email}`}>{st.email as string}</a></li>
            <li><a href={`https://wa.me/${st.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp · {st.phone as string}</a></li>
            <li><span className="os-footer__hours">{lang === 'fr' ? 'Jour & nuit — 24/7' : 'Day & night — 24/7'}</span></li>
          </ul>
        </div>
      </div>

      {/* Signature monumentale — wordmark en contour, rogné à la ligne de base */}
      <div className="os-footer__sig" aria-hidden>
        <span>{brand}</span>
      </div>

      {/* Ligne légale */}
      <div className="os-container os-footer__bottom">
        <span>© {year} Oui Stars — {t.footer.rights}</span>
        <span className="os-footer__legal">
          <a href="#">{t.footer.terms}</a><i>·</i><a href="#">{t.footer.privacy}</a><i>·</i><a href="#">{t.footer.cookies}</a>
        </span>
      </div>
    </footer>
  );
}
