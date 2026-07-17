import { useI18n } from '@/i18n';
import { MAIN_NAV } from '@/data/services';
import './footer.css';

interface Props { onJoin: () => void; }

export default function Footer({ onJoin }: Props) {
  const { lang, t } = useI18n();
  const year = 2026;
  return (
    <footer className="os-footer" id="contact">
      <div className="os-container os-footer__grid">
        <div>
          <div className="os-footer__brand">OUI<span>STARS</span></div>
          <p className="os-footer__tag">{t.footer.tagline}</p>
          <button className="os-btn os-btn--ghost" onClick={onJoin}>{t.nav.join}</button>
        </div>

        <div>
          <h4>Services</h4>
          <ul>
            {MAIN_NAV.filter((n) => n.id !== 'contact').map((n) => (
              <li key={n.id}><a href={n.href}>{lang === 'fr' ? n.fr : n.en}</a></li>
            ))}
            <li><a href="#tarifs">{t.footer.pricingLink}</a></li>
            <li><a href="#meet-greet">{t.footer.meetGreetLink}</a></li>
          </ul>
        </div>

        <div>
          <h4>{t.footer.contact}</h4>
          <ul>
            <li>{t.footer.address}</li>
            <li><a href="mailto:info@ouistars.com">info@ouistars.com</a></li>
            <li><a href="https://wa.me/33651030306">WhatsApp · +33 6 51 03 03 06</a></li>
          </ul>
        </div>
      </div>

      <hr className="os-rule" />
      <div className="os-container os-footer__bottom">
        <span>© {year} Oui Stars — {t.footer.rights}</span>
        <span className="os-footer__legal">
          <a href="#">{t.footer.terms}</a> · <a href="#">{t.footer.privacy}</a> · <a href="#">{t.footer.cookies}</a>
        </span>
      </div>
    </footer>
  );
}
