import { useI18n } from '@/i18n';
import { MAIN_NAV } from '@/data/services';
import { useSingleton } from '@/lib/cms';
import './footer.css';

interface Props { onJoin: () => void; }

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
      <div className="os-container os-footer__grid">
        <div>
          <div className="os-footer__brand">
            <img src="/logo-ouistars.png" alt="" className="os-footer__logo" loading="lazy" />
            <span className="os-footer__brandtext">{brand.slice(0, 3)}<span>{brand.slice(3)}</span></span>
          </div>
          <p className="os-footer__tag">{(st.tagline as string) || t.footer.tagline}</p>
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
            <li>{(st.address as string) || t.footer.address}</li>
            <li><a href={`mailto:${st.email}`}>{st.email as string}</a></li>
            <li><a href={`https://wa.me/${st.whatsapp}`}>WhatsApp · {st.phone as string}</a></li>
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
