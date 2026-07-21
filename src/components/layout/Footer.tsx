import { useI18n, pickL } from '@/i18n';
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
          <p className="os-eyebrow">{pickL(lang, { fr: 'Votre prochain trajet', en: 'Your next journey', es: 'Su próximo trayecto', ru: 'Ваша следующая поездка', ar: 'رحلتك القادمة' })}</p>
          <h3 className="os-footer__calltitle">
            {pickL(lang, { fr: 'Où pouvons-nous vous conduire ?', en: 'Where may we take you?', es: '¿A dónde podemos llevarle?', ru: 'Куда вас отвезти?', ar: 'إلى أين يمكننا اصطحابك؟' })}
          </h3>
        </div>
        <div className="os-footer__callactions">
          {/* Recrutement chauffeurs — carte imagée (héritage « Become a partner ») */}
          <button className="os-footer__joincard" onClick={onJoin} type="button">
            <img src="/corp-chauffeur.webp" alt="" loading="lazy" />
            <span className="os-footer__joincard-veil" aria-hidden />
            <span className="os-footer__joincard-txt">
              <em>{pickL(lang, { fr: 'Recrutement chauffeurs', en: 'Chauffeur recruitment', es: 'Reclutamiento de chóferes', ru: 'Набор водителей', ar: 'توظيف السائقين' })}</em>
              <strong>{pickL(lang, { fr: 'Devenez partenaire', en: 'Become a partner', es: 'Hágase socio', ru: 'Станьте партнёром', ar: 'كن شريكًا' })}</strong>
              <span className="os-footer__joincard-cta">
                {pickL(lang, { fr: 'Déposer ma candidature', en: 'Submit my application', es: 'Enviar mi candidatura', ru: 'Отправить заявку', ar: 'إرسال ترشحي' })} →
              </span>
            </span>
          </button>
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
          <h4>{pickL(lang, { fr: 'Explorer', en: 'Explore', es: 'Explorar', ru: 'Разделы', ar: 'استكشف' })}</h4>
          <ul className="os-footer__links os-footer__links--2col">
            {MAIN_NAV.filter((n) => n.id !== 'contact').map((n) => (
              <li key={n.id}><a href={n.href}>{n[lang]}</a></li>
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
            <li><span className="os-footer__hours">{pickL(lang, { fr: 'Jour & nuit — 24/7', en: 'Day & night — 24/7', es: 'Día y noche — 24/7', ru: 'Днём и ночью — 24/7', ar: 'ليلاً ونهاراً — 24/7' })}</span></li>
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
