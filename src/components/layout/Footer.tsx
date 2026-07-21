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
          <a className="os-btn os-btn--gold" href={`https://wa.me/${st.whatsapp}`} target="_blank" rel="noreferrer">
            {pickL(lang, { fr: 'Conciergerie 24/7', en: 'Concierge 24/7', es: 'Conserjería 24/7', ru: 'Консьерж 24/7', ar: 'كونسيرج 24/7' })}
          </a>
          <button className="os-btn os-btn--ghost" onClick={onJoin}>{t.nav.join}</button>
        </div>
      </div>

      {/* Recrutement chauffeurs — « Devenez partenaire » (héritage ancien site) */}
      <div className="os-container">
        <div className="os-footer__recruit">
          <div className="os-footer__recruit-txt">
            <p className="os-eyebrow">{pickL(lang, { fr: 'Recrutement chauffeurs', en: 'Chauffeur recruitment', es: 'Reclutamiento de chóferes', ru: 'Набор водителей', ar: 'توظيف السائقين' })}</p>
            <h3>{pickL(lang, { fr: 'Devenez partenaire', en: 'Become a partner', es: 'Hágase socio', ru: 'Станьте партнёром', ar: 'كن شريكًا' })}</h3>
            <p className="os-footer__recruit-lead">
              {pickL(lang, {
                fr: 'Complétez vos disponibilités ou faites de Oui Stars votre principale source de courses.',
                en: 'Fill the gaps in your schedule — or make Oui Stars your main source of rides.',
                es: 'Complete su agenda o haga de Oui Stars su principal fuente de servicios.',
                ru: 'Заполняйте свободные часы — или сделайте Oui Stars основным источником заказов.',
                ar: 'املأ فراغات جدولك أو اجعل Oui Stars مصدر مشاويرك الرئيسي.',
              })}
            </p>
            <ul className="os-footer__recruit-points">
              <li>{pickL(lang, { fr: 'Courses premium, clientèle internationale', en: 'Premium rides, international clientele', es: 'Servicios premium, clientela internacional', ru: 'Премиальные поездки, международные клиенты', ar: 'مشاوير فاخرة وعملاء دوليون' })}</li>
              <li>{pickL(lang, { fr: 'Avec ou sans véhicule personnel', en: 'With or without your own vehicle', es: 'Con o sin vehículo propio', ru: 'Со своим автомобилем или без', ar: 'بسيارتك الخاصة أو بدونها' })}</li>
              <li>{pickL(lang, { fr: 'Conciergerie dédiée aux chauffeurs 24/7', en: 'Dedicated chauffeur concierge 24/7', es: 'Conserjería dedicada 24/7', ru: 'Круглосуточная поддержка водителей', ar: 'خدمة مخصصة للسائقين 24/7' })}</li>
            </ul>
          </div>
          <div className="os-footer__recruit-cta">
            <button className="os-btn os-btn--gold" onClick={onJoin}>
              {pickL(lang, { fr: 'Déposer ma candidature', en: 'Submit my application', es: 'Enviar mi candidatura', ru: 'Отправить заявку', ar: 'إرسال ترشحي' })}
            </button>
            <p className="os-footer__recruit-note">
              {pickL(lang, {
                fr: 'Pièces obligatoires : photo de profil, permis, carte VTC — et carte grise, contrôle technique, assurance, photo du véhicule si vous roulez avec le vôtre.',
                en: 'Required documents: profile photo, licence, PHV card — plus registration, maintenance control, insurance and vehicle photo if you drive your own.',
                es: 'Documentos obligatorios: foto de perfil, permiso, tarjeta VTC — y permiso de circulación, ITV, seguro y foto del vehículo si conduce el suyo.',
                ru: 'Обязательные документы: фото, права, карта VTC — плюс регистрация, техосмотр, страховка и фото автомобиля, если он ваш.',
                ar: 'مستندات إلزامية: صورة شخصية، رخصة القيادة، بطاقة VTC — إضافةً إلى أوراق السيارة والفحص التقني والتأمين وصورتها إن كنت تقود سيارتك.',
              })}
            </p>
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
          <a href="#">{t.footer.terms}</a><i>·</i><a href="#">{t.footer.privacy}</a><i>·</i><a href="#">{t.footer.cookies}</a>
        </span>
      </div>
    </footer>
  );
}
