import { useRef, useState } from 'react';
import { useI18n, pickL, type L5 } from '@/i18n';
import Reveal from '@/components/ui/Reveal';
import { usePublished } from '@/lib/cms';
import { useAutoScroll } from '@/lib/useAutoScroll';
import './sections.css';

/** Événements & Congrès — split éditorial : image expressive encadrée + texte. */
export function Events({ onQuote }: { onQuote: () => void }) {
  const { lang, t } = useI18n();
  return (
    <>
      <section className="os-section os-ev" id="events">
        <div className="os-container">
          <div className="os-ev__grid">
            <Reveal>
              <figure className="os-ev__media">
                <img src="/why-paris-night.webp" alt={t.events.title} loading="lazy" />
                <figcaption><i>✦</i>{pickL(lang, { fr: 'Paris, un soir de sommet', en: 'Paris, summit night', es: 'París, noche de cumbre', ru: 'Париж, вечер саммита', ar: 'باريس، ليلة قمة' })}</figcaption>
              </figure>
            </Reveal>
            <Reveal>
              <div className="os-ev__content">
                <p className="os-eyebrow">{t.events.eyebrow}</p>
                <h2 className="os-ev__title">{t.events.title}</h2>
                <p className="os-lead os-ev__lead">{t.events.lead}</p>
                <ul className="os-ev__list">
                  {t.events.coordinate.map((c, i) => (
                    <li key={c}><i>{String(i + 1).padStart(2, '0')}</i>{c}</li>
                  ))}
                </ul>
                <button className="os-btn os-btn--gold" onClick={onQuote}>{t.events.cta}</button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <FashionWeeks />
      <DmcBand onQuote={onQuote} />
    </>
  );
}

/** Fashion Weeks — split miroir : texte à gauche, image expressive encadrée à droite. */
function FashionWeeks() {
  const { lang, t } = useI18n();
  return (
    <section className="os-section os-fw" id="fashion">
      <div className="os-container">
        <div className="os-fw__grid">
          <Reveal>
            <div className="os-fw__content">
              <p className="os-eyebrow">{t.fashion.eyebrow}</p>
              <h2 className="os-fw__title">{t.fashion.title}</h2>
              <p className="os-lead os-fw__lead">{t.fashion.lead}</p>
              <ul className="os-fw__points">
                {t.fashion.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          </Reveal>
          <Reveal>
            <figure className="os-fw__media">
              <img src="/why-vip.webp" alt={t.fashion.title} loading="lazy" />
              <figcaption><i>✦</i>{pickL(lang, { fr: 'Backstage, minute par minute', en: 'Backstage, minute by minute', es: 'Backstage, minuto a minuto', ru: 'Бэкстейдж, минута за минутой', ar: 'الكواليس، دقيقة بدقيقة' })}</figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Fiches Corporate & Institutions (rail auto + popup d'information). */
const CORP_TITLE: L5 = {
  fr: 'Des partenariats à la hauteur de vos exigences',
  en: 'Partnerships that meet your standards',
  es: 'Alianzas a la altura de sus exigencias',
  ru: 'Партнёрства, достойные ваших требований',
  ar: 'شراكات بمستوى تطلعاتكم',
};

interface CorpItem { src: string; name: L5; desc: L5; tag: L5 }
const CORP_ITEMS: CorpItem[] = [
  { src: '/corp-embassy.webp',
    name: { fr: 'Ambassades & Délégations', en: 'Embassies & Delegations', es: 'Embajadas & Delegaciones', ru: 'Посольства и делегации', ar: 'السفارات والوفود' },
    desc: { fr: 'Protocole, sécurité et discrétion pour délégations officielles : cortèges coordonnés, chauffeurs habilités, gestion des préséances et liaison avec les services de sécurité.', en: 'Protocol, security and discretion for official delegations: coordinated motorcades, vetted chauffeurs, precedence management and liaison with security services.', es: 'Protocolo, seguridad y discreción para delegaciones oficiales: comitivas coordinadas, chóferes acreditados, gestión de precedencias y enlace con los servicios de seguridad.', ru: 'Протокол, безопасность и деликатность для официальных делегаций: слаженные кортежи, аккредитованные шофёры, соблюдение старшинства и связь со службами безопасности.', ar: 'بروتوكول وأمن وكتمان للوفود الرسمية: مواكب منسقة، سائقون معتمدون، إدارة الأسبقيات وتنسيق مع الجهات الأمنية.' },
    tag: { fr: 'Protocole & préséances', en: 'Protocol & precedence', es: 'Protocolo & precedencias', ru: 'Протокол и старшинство', ar: 'البروتوكول والأسبقيات' } },
  { src: '/corp-corporate.webp',
    name: { fr: 'Comptes Entreprises', en: 'Corporate Accounts', es: 'Cuentas de Empresa', ru: 'Корпоративные счета', ar: 'حسابات الشركات' },
    desc: { fr: 'Facturation centralisée, reporting mensuel, politiques de voyage et interlocuteur dédié : la mobilité de vos équipes, sans friction administrative.', en: 'Centralised billing, monthly reporting, travel policies and a dedicated account manager: your teams’ mobility without administrative friction.', es: 'Facturación centralizada, informes mensuales, políticas de viaje y un gestor dedicado: la movilidad de sus equipos, sin fricción administrativa.', ru: 'Единый счёт, ежемесячная отчётность, тревел-политики и персональный менеджер: мобильность ваших команд без административных хлопот.', ar: 'فوترة مركزية، تقارير شهرية، سياسات سفر ومدير حساب مخصص: تنقّل فرقكم دون أي عبء إداري.' },
    tag: { fr: 'Facturation centralisée', en: 'Centralised billing', es: 'Facturación centralizada', ru: 'Единый счёт', ar: 'فوترة مركزية' } },
  { src: '/corp-travel.webp',
    name: { fr: 'Agences de voyage & DMC', en: 'Travel Agencies & DMCs', es: 'Agencias de viaje & DMC', ru: 'Турагентства и DMC', ar: 'وكالات السفر وDMC' },
    desc: { fr: 'Partenariats en marque blanche pour agences et DMC : tarifs négociés, disponibilité garantie et exécution irréprochable sous votre nom.', en: 'White-label partnerships for agencies and DMCs: negotiated rates, guaranteed availability and flawless execution under your name.', es: 'Alianzas de marca blanca para agencias y DMC: tarifas negociadas, disponibilidad garantizada y una ejecución impecable bajo su nombre.', ru: 'White-label партнёрства для агентств и DMC: согласованные тарифы, гарантированная доступность и безупречное исполнение под вашим именем.', ar: 'شراكات بالعلامة البيضاء للوكالات وDMC: أسعار متفاوض عليها، توافر مضمون وتنفيذ لا تشوبه شائبة باسمكم.' },
    tag: { fr: 'Marque blanche', en: 'White label', es: 'Marca blanca', ru: 'White label', ar: 'العلامة البيضاء' } },
  { src: '/corp-aviation.webp',
    name: { fr: 'Aviation Privée & d’Affaires', en: 'Private & Business Aviation', es: 'Aviación Privada & de Negocios', ru: 'Частная и деловая авиация', ar: 'الطيران الخاص وطيران الأعمال' },
    desc: { fr: 'Assistance FBO, opérations au Bourget et coordination sol-air : vos passagers passent du jet au salon sans la moindre friction.', en: 'FBO assistance, Le Bourget operations and ground-to-air coordination: passengers move from jet to lounge without friction.', es: 'Asistencia FBO, operaciones en Le Bourget y coordinación tierra-aire: sus pasajeros pasan del jet al salón sin la menor fricción.', ru: 'FBO-сопровождение, операции в Ле-Бурже и координация «земля-воздух»: пассажиры переходят из джета в лаундж без малейших усилий.', ar: 'مساعدة FBO، عمليات في لوبورجيه وتنسيق بري-جوي: ينتقل ركابكم من الطائرة إلى الصالة بلا أدنى عناء.' },
    tag: { fr: 'FBO · Le Bourget', en: 'FBO · Le Bourget', es: 'FBO · Le Bourget', ru: 'FBO · Ле-Бурже', ar: 'FBO · لوبورجيه' } },
  { src: '/corp-hotel.webp',
    name: { fr: 'Hôtels & Hospitality', en: 'Hotels & Hospitality', es: 'Hoteles & Hospitality', ru: 'Отели и гостеприимство', ar: 'الفنادق والضيافة' },
    desc: { fr: 'Partenariats palaces et gestion des flux clients VIP : voituriers, transferts invités et navettes événementielles au standard de votre maison.', en: 'Palace partnerships and VIP guest flows: valets, guest transfers and event shuttles to your house’s standard.', es: 'Alianzas con grandes hoteles y gestión de flujos VIP: aparcacoches, traslados de huéspedes y lanzaderas para eventos al estándar de su casa.', ru: 'Партнёрства с дворцовыми отелями и потоки VIP-гостей: валет-сервис, трансферы гостей и шаттлы мероприятий по стандартам вашего дома.', ar: 'شراكات مع الفنادق الفاخرة وإدارة تدفق كبار الضيوف: خدمة صف السيارات، نقل النزلاء وحافلات الفعاليات وفق معايير داركم.' },
    tag: { fr: 'Palaces & voituriers', en: 'Palaces & valets', es: 'Grandes hoteles & valets', ru: 'Отели и валет-сервис', ar: 'فنادق فاخرة وخدمة صف' } },
  { src: '/corp-chauffeur.webp',
    name: { fr: 'Chauffeurs dédiés', en: 'Dedicated Chauffeurs', es: 'Chóferes dedicados', ru: 'Персональные шофёры', ar: 'سائقون مخصصون' },
    desc: { fr: 'Un chauffeur attitré à la semaine ou au mois : mêmes visages, mêmes standards, connaissance intime de vos habitudes et de vos adresses.', en: 'A dedicated chauffeur by the week or month: same faces, same standards, intimate knowledge of your habits and addresses.', es: 'Un chófer asignado por semana o por mes: mismas caras, mismos estándares, conocimiento íntimo de sus hábitos y direcciones.', ru: 'Закреплённый шофёр на неделю или месяц: те же лица, те же стандарты, глубокое знание ваших привычек и адресов.', ar: 'سائق مخصص أسبوعياً أو شهرياً: نفس الوجوه، نفس المعايير، ومعرفة دقيقة بعاداتكم وعناوينكم.' },
    tag: { fr: 'À la semaine ou au mois', en: 'Weekly or monthly', es: 'Por semana o por mes', ru: 'На неделю или месяц', ar: 'أسبوعياً أو شهرياً' } },
];

/** Bande Destination Management + Aviation Privée & Conciergerie (cartes image corp-*). */
function DmcBand({ onQuote }: { onQuote: () => void }) {
  const { lang, t } = useI18n();
  const corpRef = useRef<HTMLDivElement>(null);
  const [corpInfo, setCorpInfo] = useState<CorpItem | null>(null);
  const [corpAllOpen, setCorpAllOpen] = useState(false);
  useAutoScroll(corpRef, { speed: 0.45, paused: corpInfo !== null || corpAllOpen });
  const dmcPoints = ({
    fr: ['Organisation locale & logistique de terrain', 'Itinéraires & expériences sur mesure', 'Sélection hôtelière, palaces & hospitality', 'Protocole ambassades & délégations officielles'],
    en: ['Local organisation & ground logistics', 'Bespoke itineraries & experiences', 'Hotel selection, palaces & hospitality', 'Embassy protocol & official delegations'],
    es: ['Organización local & logística de terreno', 'Itinerarios & experiencias a medida', 'Selección hotelera, grandes hoteles & hospitality', 'Protocolo de embajadas & delegaciones oficiales'],
    ru: ['Локальная организация и логистика на месте', 'Индивидуальные маршруты и впечатления', 'Подбор отелей, дворцовые отели и гостеприимство', 'Протокол посольств и официальных делегаций'],
    ar: ['تنظيم محلي ولوجستيات ميدانية', 'مسارات وتجارب مصممة خصيصاً', 'اختيار الفنادق، فنادق فاخرة وضيافة', 'بروتوكول السفارات والوفود الرسمية'],
  } as Record<typeof lang, string[]>)[lang];

  return (
    <>
    <section className="os-section" id="dmc-band">
      <div className="os-container">
        <div className="os-band__grid">
          <Reveal>
            <p className="os-eyebrow">Destination Management</p>
            <h2>{pickL(lang, { fr: 'Votre partenaire local, partout en France', en: 'Your local partner, across France', es: 'Su socio local, en toda Francia', ru: 'Ваш локальный партнёр по всей Франции', ar: 'شريككم المحلي في كل أنحاء فرنسا' })}</h2>
            <p className="os-lead">
              {pickL(lang, {
                fr: 'Oui Stars conçoit et orchestre vos programmes sur place : une seule maison, un seul interlocuteur — de l’arrivée à l’aéroport au dernier dîner.',
                en: 'Oui Stars designs and orchestrates your programmes on the ground: one house, one point of contact — from airport arrival to the final dinner.',
                es: 'Oui Stars diseña y orquesta sus programas sobre el terreno: una sola casa, un solo interlocutor — de la llegada al aeropuerto a la última cena.',
                ru: 'Oui Stars продумывает и ведёт ваши программы на месте: один дом, один собеседник — от прилёта до последнего ужина.',
                ar: 'تصمّم Oui Stars برامجكم وتديرها ميدانياً: دار واحدة ومحاور واحد — من الوصول إلى المطار حتى العشاء الأخير.',
              })}
            </p>
            <ul className="os-dmcband__list">
              {dmcPoints.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </Reveal>
          <Reveal>
            <div className="grid gap-4">
              <ImageCard
                src="/corp-aviation.webp"
                title={pickL(lang, { fr: 'Aviation Privée & d’Affaires', en: 'Private & Business Aviation', es: 'Aviación Privada & de Negocios', ru: 'Частная и деловая авиация', ar: 'الطيران الخاص وطيران الأعمال' })}
                text={pickL(lang, {
                  fr: 'Assistance FBO, opérations au Bourget et coordination sol-air : vos passagers passent du jet au salon sans la moindre friction.',
                  en: 'FBO assistance, Le Bourget operations and ground-to-air coordination: your passengers move from jet to lounge without a single friction.',
                  es: 'Asistencia FBO, operaciones en Le Bourget y coordinación tierra-aire: sus pasajeros pasan del jet al salón sin fricción alguna.',
                  ru: 'FBO-сопровождение, операции в Ле-Бурже и координация «земля-воздух»: ваши пассажиры переходят из джета в лаундж без усилий.',
                  ar: 'مساعدة FBO وعمليات لوبورجيه وتنسيق بري-جوي: ينتقل ركابكم من الطائرة إلى الصالة بلا أي عناء.',
                })}
              />
              <ImageCard
                src="/corp-hotel.webp"
                title={pickL(lang, { fr: 'Conciergerie', en: 'Concierge', es: 'Conserjería', ru: 'Консьерж-сервис', ar: 'الكونسيرج' })}
                text={pickL(lang, {
                  fr: 'Réservations, demandes sur mesure et coordination 24/7 — notre conciergerie prolonge chaque trajet en expérience.',
                  en: 'Reservations, bespoke requests and 24/7 coordination — our concierge turns every journey into an experience.',
                  es: 'Reservas, peticiones a medida y coordinación 24/7 — nuestra conserjería convierte cada trayecto en una experiencia.',
                  ru: 'Бронирования, индивидуальные запросы и координация 24/7 — наш консьерж превращает каждую поездку в опыт.',
                  ar: 'حجوزات وطلبات مخصصة وتنسيق 24/7 — الكونسيرج لدينا يحوّل كل رحلة إلى تجربة.',
                })}
              />
            </div>
          </Reveal>
        </div>

      </div>
    </section>

    {/* Corporate & Institutions — section à part entière, vitrine auto-défilante */}
    <section className="os-section" id="corporate">
      <Reveal>
        <div className="os-container">
          <div className="os-pk__head">
            <div>
              <p className="os-eyebrow">{t.corporate.eyebrow}</p>
              <h2 className="os-pk__title">
                {pickL(lang, CORP_TITLE)}
              </h2>
            </div>
            <div className="os-pk__headright">
              <span className="os-pk__hint">{pickL(lang, { fr: 'Cliquez sur une fiche', en: 'Click a card', es: 'Haga clic en una ficha', ru: 'Нажмите на карточку', ar: 'انقر على بطاقة' })}</span>
              <button type="button" className="os-gal__openbtn" onClick={() => setCorpAllOpen(true)}>
                {pickL(lang, { fr: 'Tout afficher', en: 'View all', es: 'Ver todo', ru: 'Показать все', ar: 'عرض الكل' })}
                <i>{String(CORP_ITEMS.length).padStart(2, '0')}</i>
              </button>
            </div>
          </div>
        </div>
        <div className="os-pk__rail os-pk__rail--wide os-pk__rail--corp" ref={corpRef}>
          {[...CORP_ITEMS, ...CORP_ITEMS].map((c, i) => (
            <article key={`${c.src}-${i}`} className="os-pk__card os-pk__card--corp" onClick={() => setCorpInfo(c)}
              role="button" tabIndex={i < CORP_ITEMS.length ? 0 : -1}
              onKeyDown={(e) => e.key === 'Enter' && setCorpInfo(c)}>
              <img src={c.src} alt={pickL(lang, c.name)} loading="lazy" />
              <div className="os-pk__scrim" aria-hidden />
              <span className="os-pk__num">{String((i % CORP_ITEMS.length) + 1).padStart(2, '0')}</span>
              <div className="os-pk__body">
                <h3 className="os-pk__route">{pickL(lang, c.name)}</h3>
                <span className="os-pk__book">{pickL(lang, c.tag)} →</span>
              </div>
            </article>
          ))}
        </div>
      </Reveal>

      {/* Galerie « Tout afficher » — l'index complet des partenariats */}
      {corpAllOpen && (
        <div className="os-gal" role="dialog" aria-modal aria-label={t.corporate.eyebrow} onClick={() => setCorpAllOpen(false)}>
          <div className="os-gal__panel" onClick={(e) => e.stopPropagation()}>
            <button className="os-dpop__close" onClick={() => setCorpAllOpen(false)} aria-label={t.common.close}>×</button>
            <header className="os-gal__head">
              <div>
                <p className="os-eyebrow">{t.corporate.eyebrow}</p>
                <h3 className="os-gal__title">
                  {pickL(lang, CORP_TITLE)}
                </h3>
              </div>
              <span className="os-gal__count">{String(CORP_ITEMS.length).padStart(2, '0')} {pickL(lang, { fr: 'expertises', en: 'areas of expertise', es: 'especialidades', ru: 'направлений', ar: 'مجالات خبرة' })}</span>
            </header>
            <div className="os-gal__grid">
              {CORP_ITEMS.map((c, i) => (
                <article key={c.src} className={`os-gal__card${i === 0 ? ' os-gal__card--feat' : ''}`}
                  style={{ animationDelay: `${i * 70}ms` }}
                  onClick={() => { setCorpAllOpen(false); setCorpInfo(c); }} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && (setCorpAllOpen(false), setCorpInfo(c))}>
                  <div className="os-gal__media">
                    <img src={c.src} alt={pickL(lang, c.name)} loading="lazy" />
                    <span className="os-gal__num">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="os-gal__body">
                    <h4>{pickL(lang, c.name)}</h4>
                    <p className="os-gal__desc">{pickL(lang, c.desc)}</p>
                    <span className="os-gal__more">{pickL(lang, c.tag)} →</span>
                  </div>
                </article>
              ))}
            </div>
            <footer className="os-gal__foot">
              <span>{pickL(lang, { fr: 'Chaque partenariat s’accompagne d’un interlocuteur dédié.', en: 'Every partnership comes with a dedicated account manager.', es: 'Cada alianza cuenta con un gestor dedicado.', ru: 'Каждое партнёрство сопровождает персональный менеджер.', ar: 'كل شراكة يرافقها مدير حساب مخصص.' })}</span>
              <a href="#corporate" onClick={() => { setCorpAllOpen(false); onQuote(); }}>{t.events.cta} →</a>
            </footer>
          </div>
        </div>
      )}

      {/* Popup fiche corporate */}
      {corpInfo && (
        <div className="os-dpop" role="dialog" aria-modal aria-label={pickL(lang, corpInfo.name)} onClick={() => setCorpInfo(null)}>
          <div className="os-dpop__panel" onClick={(e) => e.stopPropagation()}>
            <button className="os-dpop__close" onClick={() => setCorpInfo(null)} aria-label={t.common.close}>×</button>
            <div className="os-dpop__media">
              <img src={corpInfo.src} alt={pickL(lang, corpInfo.name)} />
              <span className="os-dpop__chip">{t.corporate.eyebrow}</span>
            </div>
            <div className="os-dpop__body">
              <h3 className="os-dpop__title">{pickL(lang, corpInfo.name)}</h3>
              <p className="os-dpop__desc">{pickL(lang, corpInfo.desc)}</p>
              <button className="os-btn os-btn--gold os-dpop__cta"
                onClick={() => { setCorpInfo(null); onQuote(); }}>
                {t.events.cta}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
    </>
  );
}

/** Carte horizontale image + texte (aviation, conciergerie…). */
function ImageCard({ src, title, text }: { src: string; title: string; text: string }) {
  return (
    <article className="group grid overflow-hidden rounded-2xl border border-gold-deep/20 bg-surface/60 transition-colors duration-500 hover:border-gold-deep/60 sm:grid-cols-[190px_1fr]">
      <div className="relative min-h-[130px] overflow-hidden">
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="os-card-title font-display text-ivory">{title}</h3>
        <p className="os-small os-flush">{text}</p>
      </div>
    </article>
  );
}

/** La maison — éditorial deux colonnes : image + texte, filet doré, chiffres-clés. */
export function About() {
  const { t } = useI18n();
  return (
    <section className="os-section os-about" id="about">
      <span className="os-about__ghost" aria-hidden>Maison</span>
      <div className="os-container">
        <div className="os-about__grid">
          <Reveal>
            <figure className="os-about__media">
              <img src="/why-interior.webp" alt="Oui Stars" loading="lazy" />
            </figure>
          </Reveal>
          <Reveal>
            <div className="os-about__content">
              <p className="os-eyebrow">{t.about.eyebrow}</p>
              <h2 className="os-about__name">{t.about.name}</h2>
              <span className="os-about__rule" aria-hidden />
              <p className="os-lead">{t.about.body}</p>
              <div className="os-about__stats">
                {t.about.stats.map((s) => (
                  <div className="os-about__stat" key={s.label}>
                    <b>{s.value}</b>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** FAQ statique — 5 langues (le CMS, rédigé en français, ne remplace que le FR). */
const FAQ_I18N: { q: L5; a: L5 }[] = [
  {
    q: { fr: 'Les tarifs affichés sont-ils TTC ?', en: 'Are the displayed prices inclusive of VAT?', es: '¿Los precios mostrados incluyen IVA?', ru: 'Указаны ли цены с НДС?', ar: 'هل الأسعار المعروضة شاملة الضريبة؟' },
    a: { fr: 'Oui, tous les prix de la grille 2026-2027 sont affichés TTC, par transfert dans un sens ou dans l’autre.',
         en: 'Yes — every price in the 2026-2027 grid includes VAT, per transfer in either direction.',
         es: 'Sí, todos los precios de la tarifa 2026-2027 incluyen IVA, por traslado en cualquier sentido.',
         ru: 'Да — все цены сетки 2026-2027 указаны с НДС, за один трансфер в любую сторону.',
         ar: 'نعم — جميع أسعار تعرفة 2026-2027 شاملة الضريبة، لكل توصيلة في أي اتجاه.' },
  },
  {
    q: { fr: 'Un aller-retour, comment est-il facturé ?', en: 'How is a round trip billed?', es: '¿Cómo se factura un viaje de ida y vuelta?', ru: 'Как оплачивается поездка туда-обратно?', ar: 'كيف تُحتسب رحلة الذهاب والإياب؟' },
    a: { fr: 'Un aller-retour est facturé comme deux transferts distincts.',
         en: 'A round trip is billed as two separate transfers.',
         es: 'Un viaje de ida y vuelta se factura como dos traslados distintos.',
         ru: 'Поездка туда-обратно оплачивается как два отдельных трансфера.',
         ar: 'تُحتسب رحلة الذهاب والإياب كتوصيلتين منفصلتين.' },
  },
  {
    q: { fr: 'Le Meet & Greeter inclut-il le véhicule ?', en: 'Does the Meet & Greeter include the vehicle?', es: '¿El Meet & Greeter incluye el vehículo?', ru: 'Входит ли автомобиль в услугу Meet & Greeter?', ar: 'هل تشمل خدمة الاستقبال والمرافقة السيارة؟' },
    a: { fr: 'Non. Le service Meet & Greeter n’inclut ni le véhicule ni le chauffeur : le transport se réserve et se facture séparément.',
         en: 'No. The Meet & Greeter service includes neither the vehicle nor the chauffeur: transport is booked and billed separately.',
         es: 'No. El servicio Meet & Greeter no incluye ni el vehículo ni el chófer: el transporte se reserva y factura por separado.',
         ru: 'Нет. Услуга Meet & Greeter не включает ни автомобиль, ни шофёра: транспорт бронируется и оплачивается отдельно.',
         ar: 'لا. لا تشمل خدمة الاستقبال والمرافقة السيارة ولا السائق: يُحجز النقل ويُدفع بشكل منفصل.' },
  },
  {
    q: { fr: 'Quelle est la durée minimale d’une mise à disposition ?', en: 'What is the minimum duration for hourly hire?', es: '¿Cuál es la duración mínima de la disposición por horas?', ru: 'Какова минимальная длительность почасовой аренды?', ar: 'ما الحد الأدنى لمدة الخدمة بالساعة؟' },
    a: { fr: 'Les mises à disposition horaires requièrent un minimum de 3 heures consécutives.',
         en: 'Hourly hire requires a minimum of 3 consecutive hours.',
         es: 'La disposición por horas requiere un mínimo de 3 horas consecutivas.',
         ru: 'Почасовая аренда — минимум 3 часа подряд.',
         ar: 'تتطلب الخدمة بالساعة ثلاث ساعات متواصلة كحد أدنى.' },
  },
  {
    q: { fr: 'Des suppléments peuvent-ils s’appliquer ?', en: 'Can surcharges apply?', es: '¿Pueden aplicarse suplementos?', ru: 'Возможны ли доплаты?', ar: 'هل يمكن أن تُطبَّق رسوم إضافية؟' },
    a: { fr: 'Oui. L’attente supplémentaire, les arrêts additionnels, le parking, les péages, les services de nuit et les périodes d’événements peuvent entraîner des frais additionnels, toujours annoncés en amont.',
         en: 'Yes. Extra waiting, additional stops, parking, tolls, night service and event periods may incur additional fees — always announced in advance.',
         es: 'Sí. La espera adicional, paradas extra, parking, peajes, servicios nocturnos y períodos de eventos pueden conllevar cargos adicionales, siempre anunciados de antemano.',
         ru: 'Да. Дополнительное ожидание, лишние остановки, парковка, платные дороги, ночные поездки и периоды мероприятий могут повлечь доплаты — всегда объявляемые заранее.',
         ar: 'نعم. قد يترتب على الانتظار الإضافي والتوقفات الإضافية ومواقف السيارات ورسوم الطرق والخدمة الليلية وفترات الفعاليات رسوم إضافية — يُعلن عنها دائماً مسبقاً.' },
  },
  {
    q: { fr: 'Opérez-vous partout en France ?', en: 'Do you operate throughout France?', es: '¿Operan en toda Francia?', ru: 'Работаете ли вы по всей Франции?', ar: 'هل تعملون في جميع أنحاء فرنسا؟' },
    a: { fr: 'Oui — nos opérations sont nationales : Paris et Île-de-France, Côte d’Azur, et l’ensemble du territoire pour vos transferts, tournées et événements.',
         en: 'Yes — our operations are nationwide: Paris and Île-de-France, the Riviera, and the whole territory for your transfers, tours and events.',
         es: 'Sí — nuestras operaciones son nacionales: París e Île-de-France, la Costa Azul y todo el territorio para sus traslados, giras y eventos.',
         ru: 'Да — мы работаем по всей стране: Париж и Иль-де-Франс, Лазурный берег и вся территория для ваших трансферов, туров и мероприятий.',
         ar: 'نعم — عملياتنا وطنية: باريس وإيل-دو-فرانس والريفييرا وكامل الأراضي الفرنسية لتوصيلاتكم وجولاتكم وفعالياتكم.' },
  },
];

const FAQ_ITEMS = FAQ_I18N.map((f) => ({ q: f.q.fr, a: f.a.fr }));

export function Faq() {
  const { lang } = useI18n();
  const cmsItems = usePublished<{ q: string; a: string }>('faq', FAQ_ITEMS);
  // Le CMS est rédigé en français → il ne remplace la FAQ qu'en FR ;
  // les autres langues affichent les traductions embarquées.
  const items = lang === 'fr' ? cmsItems : FAQ_I18N.map((f) => ({ q: pickL(lang, f.q), a: pickL(lang, f.a) }));
  return (
    <section className="os-section os-faq2" id="faq">
      <div className="os-container">
        <div className="os-faq2__layout">
          <Reveal>
            <div className="os-faq2__intro">
              <p className="os-eyebrow">FAQ</p>
              <h2 className="os-faq2__title">{pickL(lang, { fr: 'Questions fréquentes', en: 'Frequently asked', es: 'Preguntas frecuentes', ru: 'Частые вопросы', ar: 'أسئلة شائعة' })}</h2>
              <p className="os-faq2__hint">
                {pickL(lang, {
                fr: 'Une autre question ? Notre conciergerie répond 24/7.',
                en: 'Another question? Our concierge answers 24/7.',
                es: '¿Otra pregunta? Nuestra conserjería responde 24/7.',
                ru: 'Остались вопросы? Наш консьерж отвечает 24/7.',
                ar: 'سؤال آخر؟ الكونسيرج لدينا يجيب على مدار الساعة.',
              })}
              </p>
              <a className="os-faq2__contact" href="https://wa.me/33651030306" target="_blank" rel="noreferrer">
                WhatsApp · +33 6 51 03 03 06 →
              </a>
            </div>
          </Reveal>
          <Reveal>
            <div className="os-faq2__list">
              {items.map((f, i) => (
                <details key={f.q} className="os-faq2__item">
                  <summary>
                    <i>{String(i + 1).padStart(2, '0')}</i>
                    <span className="os-faq2__q">{f.q}</span>
                    <span className="os-faq2__plus" aria-hidden>+</span>
                  </summary>
                  <p className="os-faq2__a">{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
