import { useRef, useState } from 'react';
import { useI18n, pickL, type L5 } from '@/i18n';
import { ROUTE_RATES, type RouteRate } from '@/data/pricing';
import { usePricingSync } from '@/lib/livePricing';
import { useAutoScroll } from '@/lib/useAutoScroll';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

interface Props { onBook: (prefill?: string) => void; }

/** Sélection de trajets signature depuis la grille officielle. */
const FEATURED = ['cdg-ory-lbg-paris', 'paris-disneyland', 'nce-monaco', 'paris-versailles', 'nice-st-tropez', 'paris-mont-saint-michel'];

/** Table locale : route → image de destination (assets réels /public). */
const ROUTE_IMAGES: Record<string, string> = {
  'cdg-ory-lbg-paris': '/dest-paris.webp',
  'bva-paris': '/dest-paris.webp',
  'paris-paris': '/dest-paris.webp',
  'paris-disneyland': '/dest-chantilly.webp',
  'paris-versailles': '/dest-versailles.webp',
  'airports-versailles': '/dest-versailles.webp',
  'nce-monaco': '/dest-monaco.webp',
  'nce-nice': '/dest-cannes.webp',
  'nice-st-tropez': '/dest-saint-tropez.webp',
  'paris-mont-saint-michel': '/dest-normandy.webp',
  'paris-deauville': '/dest-normandy.webp',
  'paris-honfleur': '/dest-normandy.webp',
  'paris-etretat': '/dest-normandy.webp',
  'paris-le-havre': '/dest-normandy.webp',
  'paris-rouen': '/dest-normandy.webp',
  'paris-giverny': '/dest-giverny.webp',
  'paris-reims': '/dest-reims.webp',
  'paris-epernay': '/dest-reims.webp',
};
const FALLBACK_IMAGE = '/dest-paris.webp';

/** Micro-libellés de la vitrine — 5 langues. */
const TXT: Record<string, L5> = {
  hint: { fr: 'Cliquez sur une destination', en: 'Click a destination', es: 'Haga clic en un destino', ru: 'Нажмите на направление', ar: 'انقر على وجهة' },
  viewAll: { fr: 'Tout afficher', en: 'View all', es: 'Ver todo', ru: 'Показать все', ar: 'عرض الكل' },
  count: { fr: 'itinéraires', en: 'itineraries', es: 'itinerarios', ru: 'маршрутов', ar: 'مسارات' },
  foot: {
    fr: 'Chaque itinéraire se décline en E-Class, V-Class ou S-Class.',
    en: 'Every itinerary is available in E-Class, V-Class or S-Class.',
    es: 'Cada itinerario está disponible en E-Class, V-Class o S-Class.',
    ru: 'Каждый маршрут доступен в классах E-Class, V-Class и S-Class.',
    ar: 'كل مسار متاح بفئات E-Class أو V-Class أو S-Class.',
  },
  note: {
    fr: 'Disponible en E-Class, V-Class ou S-Class — notre équipe vous confirme le tarif à la réservation.',
    en: 'Available in E-Class, V-Class or S-Class — our team confirms the fare upon booking.',
    es: 'Disponible en E-Class, V-Class o S-Class — nuestro equipo le confirma la tarifa al reservar.',
    ru: 'Доступно в классах E-Class, V-Class и S-Class — тариф подтверждается при бронировании.',
    ar: 'متاح بفئات E-Class أو V-Class أو S-Class — يؤكد فريقنا السعر عند الحجز.',
  },
};

/** Libellés d'affichage des routes — 5 langues (le préremplissage du
    formulaire conserve le libellé français de la grille pour le back-office). */
const ROUTE_LABELS: Record<string, L5> = {
  'cdg-ory-lbg-paris': {
    fr: 'Aéroports Paris (CDG • ORY • LBG) ⇄ Paris', en: 'Paris Airports (CDG • ORY • LBG) ⇄ Paris',
    es: 'Aeropuertos de París (CDG • ORY • LBG) ⇄ París', ru: 'Аэропорты Парижа (CDG • ORY • LBG) ⇄ Париж',
    ar: 'مطارات باريس (CDG • ORY • LBG) ⇄ باريس',
  },
  'paris-disneyland': { fr: 'Paris ⇄ Disneyland', en: 'Paris ⇄ Disneyland', es: 'París ⇄ Disneyland', ru: 'Париж ⇄ Диснейленд', ar: 'باريس ⇄ ديزني لاند' },
  'nce-monaco': { fr: 'Nice (NCE) ⇄ Monaco', en: 'Nice (NCE) ⇄ Monaco', es: 'Niza (NCE) ⇄ Mónaco', ru: 'Ницца (NCE) ⇄ Монако', ar: 'نيس (NCE) ⇄ موناكو' },
  'paris-versailles': { fr: 'Paris ⇄ Versailles', en: 'Paris ⇄ Versailles', es: 'París ⇄ Versalles', ru: 'Париж ⇄ Версаль', ar: 'باريس ⇄ فرساي' },
  'nice-st-tropez': { fr: 'Nice ⇄ Saint-Tropez', en: 'Nice ⇄ Saint-Tropez', es: 'Niza ⇄ Saint-Tropez', ru: 'Ницца ⇄ Сен-Тропе', ar: 'نيس ⇄ سان-تروبيه' },
  'paris-mont-saint-michel': { fr: 'Paris ⇄ Mont-Saint-Michel', en: 'Paris ⇄ Mont-Saint-Michel', es: 'París ⇄ Mont-Saint-Michel', ru: 'Париж ⇄ Мон-Сен-Мишель', ar: 'باريس ⇄ جبل سان-ميشيل' },
};

/** Notices destination (popup d'information) — 5 langues. */
const ROUTE_INFO: Record<string, L5> = {
  'cdg-ory-lbg-paris': {
    fr: 'Transferts entre les aéroports parisiens (CDG, Orly, Le Bourget) et le cœur de Paris — accueil pancarte, suivi des vols et attente incluse.',
    en: 'Transfers between Paris airports (CDG, Orly, Le Bourget) and central Paris — name-board welcome, flight tracking and waiting included.',
    es: 'Traslados entre los aeropuertos de París (CDG, Orly, Le Bourget) y el centro de la ciudad — cartel de bienvenida, seguimiento de vuelos y espera incluida.',
    ru: 'Трансферы между аэропортами Парижа (CDG, Орли, Ле-Бурже) и центром города — встреча с табличкой, отслеживание рейсов и ожидание включены.',
    ar: 'توصيلات بين مطارات باريس (CDG، أورلي، لوبورجيه) وقلب باريس — استقبال بلافتة، تتبّع الرحلات وانتظار مشمول.',
  },
  'paris-disneyland': {
    fr: 'Rejoignez Disneyland Paris depuis le centre de Paris en tout confort — idéal pour les familles, sièges enfants sur simple demande.',
    en: 'Reach Disneyland Paris from central Paris in full comfort — perfect for families, child seats on request.',
    es: 'Llegue a Disneyland París desde el centro con todo confort — ideal para familias, sillas infantiles bajo petición.',
    ru: 'Доехать до Диснейленда из центра Парижа с полным комфортом — идеально для семей, детские кресла по запросу.',
    ar: 'انطلق إلى ديزني لاند باريس من قلب المدينة بكل راحة — مثالي للعائلات، ومقاعد أطفال عند الطلب.',
  },
  'nce-monaco': {
    fr: 'De l’aéroport de Nice à la Principauté par la corniche — un trajet spectaculaire entre mer et falaises, jusqu’à votre hôtel ou le Casino.',
    en: 'From Nice airport to the Principality along the corniche — a spectacular drive between sea and cliffs, to your hotel or the Casino.',
    es: 'Del aeropuerto de Niza al Principado por la cornisa — un trayecto espectacular entre mar y acantilados, hasta su hotel o el Casino.',
    ru: 'Из аэропорта Ниццы в Княжество по корнишу — впечатляющая дорога между морем и скалами, до вашего отеля или казино.',
    ar: 'من مطار نيس إلى الإمارة عبر الكورنيش — رحلة خلابة بين البحر والمنحدرات، حتى فندقك أو الكازينو.',
  },
  'paris-versailles': {
    fr: 'Le château de Versailles à 40 minutes de Paris — mise à disposition possible pendant votre visite, retour quand vous le souhaitez.',
    en: 'The Palace of Versailles, 40 minutes from Paris — chauffeur at disposal during your visit, return whenever you wish.',
    es: 'El palacio de Versalles a 40 minutos de París — chófer a disposición durante su visita, regreso cuando lo desee.',
    ru: 'Версальский дворец в 40 минутах от Парижа — автомобиль в вашем распоряжении на время визита, возвращение когда пожелаете.',
    ar: 'قصر فرساي على بُعد 40 دقيقة من باريس — سائق تحت تصرفك أثناء زيارتك، والعودة متى شئت.',
  },
  'nice-st-tropez': {
    fr: 'La Côte d’Azur dans toute sa splendeur : de Nice au golfe de Saint-Tropez, par l’Estérel et ses panoramas.',
    en: 'The Riviera at its finest: from Nice to the Gulf of Saint-Tropez, through the Estérel and its panoramas.',
    es: 'La Costa Azul en todo su esplendor: de Niza al golfo de Saint-Tropez, por el Estérel y sus panorámicas.',
    ru: 'Лазурный берег во всём великолепии: из Ниццы к заливу Сен-Тропе, через Эстерель с его панорамами.',
    ar: 'الريفييرا الفرنسية بكل بهائها: من نيس إلى خليج سان-تروبيه، عبر إستريل وإطلالاته.',
  },
  'paris-mont-saint-michel': {
    fr: 'Journée d’exception vers la Merveille de l’Occident — itinéraire privé, arrêts à la demande, chauffeur dédié toute la journée.',
    en: 'An exceptional day trip to the Wonder of the West — private itinerary, stops on request, dedicated chauffeur all day.',
    es: 'Una jornada excepcional hacia la Maravilla de Occidente — itinerario privado, paradas a demanda, chófer dedicado todo el día.',
    ru: 'Исключительная поездка к Чуду Запада — частный маршрут, остановки по желанию, персональный шофёр на весь день.',
    ar: 'يوم استثنائي نحو أعجوبة الغرب — مسار خاص، توقفات عند الطلب، وسائق مخصص طوال اليوم.',
  },
};

/** Itinéraires signature — vitrine large à défilement automatique + popup destination. */
export default function Packages({ onBook }: Props) {
  usePricingSync();
  const { t, lang } = useI18n();
  const routes = ROUTE_RATES.filter((r) => FEATURED.includes(r.id));
  const railRef = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState<RouteRate | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  useAutoScroll(railRef, { speed: 0.5, paused: info !== null || allOpen });

  const routeLabel = (r: RouteRate) => (ROUTE_LABELS[r.id] ? pickL(lang, ROUTE_LABELS[r.id]) : r.label);

  // Contenu doublé → boucle sans couture du défilement automatique.
  const loop = [...routes, ...routes];

  return (
    <section className="os-section os-pk" id="tours">
      <div className="os-container">
        <Reveal>
          <div className="os-pk__head">
            <div>
              <p className="os-eyebrow">{t.packages.eyebrow}</p>
              <h2 className="os-pk__title">{t.packages.title}</h2>
            </div>
            <div className="os-pk__headright">
              <span className="os-pk__hint">{pickL(lang, TXT.hint)}</span>
              <button type="button" className="os-gal__openbtn" onClick={() => setAllOpen(true)}>
                {pickL(lang, TXT.viewAll)}
                <i>{String(routes.length).padStart(2, '0')}</i>
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Rail pleine largeur, défilement automatique (pause au survol) */}
      <Reveal>
        <div className="os-pk__rail os-pk__rail--wide" ref={railRef}>
          {loop.map((r, i) => (
            <article key={`${r.id}-${i}`} className="os-pk__card" onClick={() => setInfo(r)}
              role="button" tabIndex={i < routes.length ? 0 : -1}
              onKeyDown={(e) => e.key === 'Enter' && setInfo(r)}>
              <img src={ROUTE_IMAGES[r.id] ?? FALLBACK_IMAGE} alt={routeLabel(r)} loading="lazy" />
              <div className="os-pk__scrim" aria-hidden />
              <span className="os-pk__num">{String((i % routes.length) + 1).padStart(2, '0')}</span>
              <div className="os-pk__body">
                <h3 className="os-pk__route">{routeLabel(r)}</h3>
                <p className="os-pk__desc">{ROUTE_INFO[r.id] ? pickL(lang, ROUTE_INFO[r.id]) : ''}</p>
                <span className="os-pk__book">{t.cta.book} →</span>
              </div>
            </article>
          ))}
        </div>
      </Reveal>

      {/* Galerie « Tout afficher » — l'index complet des itinéraires */}
      {allOpen && (
        <div className="os-gal" role="dialog" aria-modal aria-label={t.packages.title} onClick={() => setAllOpen(false)}>
          <div className="os-gal__panel" onClick={(e) => e.stopPropagation()}>
            <button className="os-dpop__close" onClick={() => setAllOpen(false)} aria-label={t.common.close}>×</button>
            <header className="os-gal__head">
              <div>
                <p className="os-eyebrow">{t.packages.eyebrow}</p>
                <h3 className="os-gal__title">{t.packages.title}</h3>
              </div>
              <span className="os-gal__count">{String(routes.length).padStart(2, '0')} {pickL(lang, TXT.count)}</span>
            </header>
            <div className="os-gal__grid">
              {routes.map((r, i) => (
                <article key={r.id} className="os-gal__card" style={{ animationDelay: `${i * 70}ms` }}
                  onClick={() => { setAllOpen(false); setInfo(r); }} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && (setAllOpen(false), setInfo(r))}>
                  <div className="os-gal__media">
                    <img src={ROUTE_IMAGES[r.id] ?? FALLBACK_IMAGE} alt={routeLabel(r)} loading="lazy" />
                    <span className="os-gal__num">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="os-gal__body">
                    <h4>{routeLabel(r)}</h4>
                    <p className="os-gal__desc">{ROUTE_INFO[r.id] ? pickL(lang, ROUTE_INFO[r.id]) : ''}</p>
                    <span className="os-gal__more">{t.cta.book} →</span>
                  </div>
                </article>
              ))}
            </div>
            <footer className="os-gal__foot">
              <span>{pickL(lang, TXT.foot)}</span>
            </footer>
          </div>
        </div>
      )}

      {/* Popup destination */}
      {info && (
        <div className="os-dpop" role="dialog" aria-modal aria-label={info.label} onClick={() => setInfo(null)}>
          <div className="os-dpop__panel" onClick={(e) => e.stopPropagation()}>
            <button className="os-dpop__close" onClick={() => setInfo(null)} aria-label={t.common.close}>×</button>
            <div className="os-dpop__media">
              <img src={ROUTE_IMAGES[info.id] ?? FALLBACK_IMAGE} alt={routeLabel(info)} />
              <span className="os-dpop__chip">{t.pricingTables.categories[info.category]}</span>
            </div>
            <div className="os-dpop__body">
              <h3 className="os-dpop__title">{routeLabel(info)}</h3>
              <p className="os-dpop__desc">{ROUTE_INFO[info.id] ? pickL(lang, ROUTE_INFO[info.id]) : ''}</p>
              <p className="os-dpop__note">{pickL(lang, TXT.note)}</p>
              <button className="os-btn os-btn--gold os-dpop__cta"
                onClick={() => { const label = info.label; setInfo(null); onBook(label); }}>
                {t.cta.book}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
