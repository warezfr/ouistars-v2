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
        {/* Recrutement chauffeurs — panneau « Rejoignez-nous » (héritage « Become a partner ») */}
        <div className="os-footer__join">
          <figure className="os-footer__join-media" aria-hidden>
            <img src="/corp-chauffeur.webp" alt="" loading="lazy" />
            <figcaption>{pickL(lang, { fr: 'Nos chauffeurs', en: 'Our chauffeurs', es: 'Nuestros chóferes', ru: 'Наши водители', ar: 'سائقونا' })}</figcaption>
          </figure>
          <div className="os-footer__join-body">
            <p className="os-eyebrow">{pickL(lang, { fr: 'Recrutement chauffeurs', en: 'Chauffeur recruitment', es: 'Reclutamiento de chóferes', ru: 'Набор водителей', ar: 'توظيف السائقين' })}</p>
            <h3 className="os-footer__join-title">
              {pickL(lang, { fr: 'Rejoignez-nous', en: 'Join us', es: 'Únase a nosotros', ru: 'Присоединяйтесь', ar: 'انضم إلينا' })}
            </h3>
            <p className="os-footer__join-lead">
              {pickL(lang, {
                fr: 'Devenez partenaire Oui Stars — courses premium, clientèle internationale, avec ou sans votre véhicule.',
                en: 'Become a Oui Stars partner — premium rides, international clientele, with or without your own vehicle.',
                es: 'Hágase socio de Oui Stars — servicios premium, clientela internacional, con o sin su vehículo.',
                ru: 'Станьте партнёром Oui Stars — премиальные поездки, международные клиенты, со своим автомобилем или без.',
                ar: 'كن شريكًا مع Oui Stars — مشاوير فاخرة وعملاء دوليون، بسيارتك أو بدونها.',
              })}
            </p>
            <button className="os-btn os-btn--gold os-footer__join-cta" onClick={onJoin} type="button">
              {pickL(lang, { fr: 'Déposer ma candidature', en: 'Submit my application', es: 'Enviar mi candidatura', ru: 'Отправить заявку', ar: 'إرسال ترشحي' })} →
            </button>
          </div>
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
          <a href="/mentions-legales">{t.footer.terms}</a><i>·</i><a href="/confidentialite">{t.footer.privacy}</a><i>·</i><a href="/cookies">{t.footer.cookies}</a>
        </span>
      </div>
    </footer>
  );
}
