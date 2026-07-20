import { useState } from 'react';
import { useI18n, pickL, type L5 } from '@/i18n';
import Reveal from '@/components/ui/Reveal';
import './pricing-tables.css';

interface Props { onBook: (prefill?: string) => void; }

/**
 * Destinations — mosaïque éditoriale plein cadre (remplace la grille tarifaire :
 * plus aucun prix sur le front). Tuiles asymétriques ; clic → fiche destination
 * (description complète) avec bouton Réserver prérempli.
 */
interface Destination {
  id: string;
  image: string;
  region: L5;
  name: L5;
  desc: L5;
  /** Préremplissage du formulaire de réservation. */
  prefill: string;
  /** Taille de tuile dans la mosaïque. */
  size: 'hero' | 'wide' | 'tall' | 'std';
}

const DESTINATIONS: Destination[] = [
  {
    id: 'paris', image: '/dest-paris.webp', size: 'hero',
    region: { fr: 'Île-de-France', en: 'Île-de-France', es: 'Île-de-France', ru: 'Иль-де-Франс', ar: 'إيل-دو-فرانس' },
    name: { fr: 'Paris', en: 'Paris', es: 'París', ru: 'Париж', ar: 'باريس' },
    desc: {
      fr: 'La capitale, ses aéroports et ses gares : transferts CDG, Orly et Le Bourget, courses intra-muros et mises à disposition — accueil pancarte, suivi des vols et attente incluse.',
      en: 'The capital, its airports and stations: CDG, Orly and Le Bourget transfers, intra-muros journeys and hourly hire — name-board welcome, flight tracking and waiting included.',
      es: 'La capital, sus aeropuertos y estaciones: traslados CDG, Orly y Le Bourget, trayectos urbanos y disposición por horas — cartel de bienvenida, seguimiento de vuelos y espera incluida.',
      ru: 'Столица, её аэропорты и вокзалы: трансферы CDG, Орли и Ле-Бурже, поездки по городу и почасовая аренда — встреча с табличкой, отслеживание рейсов и ожидание включены.',
      ar: 'العاصمة ومطاراتها ومحطاتها: توصيلات CDG وأورلي ولوبورجيه، مشاوير داخل المدينة وخدمة بالساعة — استقبال بلافتة وتتبّع الرحلات وانتظار مشمول.',
    },
    prefill: 'Paris ⇄ Aéroports (CDG · ORY · LBG)',
  },
  {
    id: 'versailles', image: '/dest-versailles.webp', size: 'std',
    region: { fr: 'Yvelines', en: 'Yvelines', es: 'Yvelines', ru: 'Ивелин', ar: 'إيفلين' },
    name: { fr: 'Versailles', en: 'Versailles', es: 'Versalles', ru: 'Версаль', ar: 'فرساي' },
    desc: {
      fr: 'Le château et ses jardins à 40 minutes de Paris — mise à disposition possible pendant votre visite, retour quand vous le souhaitez.',
      en: 'The palace and its gardens, 40 minutes from Paris — chauffeur at disposal during your visit, return whenever you wish.',
      es: 'El palacio y sus jardines a 40 minutos de París — chófer a disposición durante su visita, regreso cuando lo desee.',
      ru: 'Дворец и сады в 40 минутах от Парижа — автомобиль в распоряжении на время визита, возвращение когда пожелаете.',
      ar: 'القصر وحدائقه على بُعد 40 دقيقة من باريس — سائق تحت تصرفك أثناء الزيارة والعودة متى شئت.',
    },
    prefill: 'Paris ⇄ Versailles',
  },
  {
    id: 'disneyland', image: '/dest-chantilly.webp', size: 'std',
    region: { fr: 'Marne-la-Vallée', en: 'Marne-la-Vallée', es: 'Marne-la-Vallée', ru: 'Марн-ля-Вале', ar: 'مارن-لا-فاليه' },
    name: { fr: 'Disneyland Paris', en: 'Disneyland Paris', es: 'Disneyland París', ru: 'Диснейленд Париж', ar: 'ديزني لاند باريس' },
    desc: {
      fr: 'Rejoignez les parcs en tout confort depuis Paris ou les aéroports — idéal pour les familles, sièges enfants sur simple demande.',
      en: 'Reach the parks in full comfort from Paris or the airports — perfect for families, child seats on request.',
      es: 'Llegue a los parques con todo confort desde París o los aeropuertos — ideal para familias, sillas infantiles bajo petición.',
      ru: 'Доберитесь до парков с комфортом из Парижа или аэропортов — идеально для семей, детские кресла по запросу.',
      ar: 'انطلق إلى المدينة الترفيهية بكل راحة من باريس أو المطارات — مثالي للعائلات ومقاعد أطفال عند الطلب.',
    },
    prefill: 'Paris ⇄ Disneyland',
  },
  {
    id: 'giverny', image: '/dest-giverny.webp', size: 'tall',
    region: { fr: 'Normandie', en: 'Normandy', es: 'Normandía', ru: 'Нормандия', ar: 'النورماندي' },
    name: { fr: 'Giverny', en: 'Giverny', es: 'Giverny', ru: 'Живерни', ar: 'جيفرني' },
    desc: {
      fr: 'Les jardins de Monet et la maison aux volets verts — une parenthèse impressionniste à une heure de Paris, arrêts photo à la demande.',
      en: 'Monet’s gardens and the green-shuttered house — an impressionist interlude an hour from Paris, photo stops on request.',
      es: 'Los jardines de Monet y la casa de postigos verdes — un paréntesis impresionista a una hora de París, con paradas para fotos.',
      ru: 'Сады Моне и дом с зелёными ставнями — импрессионистская пауза в часе от Парижа, фотоостановки по желанию.',
      ar: 'حدائق مونيه والمنزل ذو النوافذ الخضراء — استراحة انطباعية على بُعد ساعة من باريس مع توقفات للتصوير.',
    },
    prefill: 'Paris ⇄ Giverny',
  },
  {
    id: 'champagne', image: '/dest-reims.webp', size: 'wide',
    region: { fr: 'Champagne', en: 'Champagne', es: 'Champaña', ru: 'Шампань', ar: 'الشامبانيا' },
    name: { fr: 'Reims & Épernay', en: 'Reims & Épernay', es: 'Reims & Épernay', ru: 'Реймс и Эперне', ar: 'رانس وإيبرناي' },
    desc: {
      fr: 'La cathédrale du sacre et l’avenue de Champagne : caves, dégustations et déjeuners de maison en maison, votre chauffeur toute la journée.',
      en: 'The coronation cathedral and the Avenue de Champagne: cellars, tastings and lunches from house to house, your chauffeur all day.',
      es: 'La catedral de las coronaciones y la Avenue de Champagne: bodegas, catas y almuerzos de casa en casa, su chófer todo el día.',
      ru: 'Коронационный собор и Авеню Шампани: погреба, дегустации и обеды от дома к дому, ваш шофёр на весь день.',
      ar: 'كاتدرائية التتويج وجادة الشامبانيا: أقبية وتذوّق وغداء من دار إلى دار، وسائقك طوال اليوم.',
    },
    prefill: 'Paris ⇄ Reims / Épernay',
  },
  {
    id: 'normandie', image: '/dest-normandy.webp', size: 'wide',
    region: { fr: 'Normandie', en: 'Normandy', es: 'Normandía', ru: 'Нормандия', ar: 'النورماندي' },
    name: { fr: 'Deauville, Honfleur & Mont-Saint-Michel', en: 'Deauville, Honfleur & Mont-Saint-Michel', es: 'Deauville, Honfleur & Mont-Saint-Michel', ru: 'Довиль, Онфлёр и Мон-Сен-Мишель', ar: 'دوفيل وأونفلور وجبل سان-ميشيل' },
    desc: {
      fr: 'Les planches de Deauville, le vieux bassin d’Honfleur, les falaises d’Étretat et la Merveille de l’Occident — journées d’exception, itinéraire privé et chauffeur dédié.',
      en: 'The Deauville boardwalk, Honfleur’s old harbour, the Étretat cliffs and the Wonder of the West — exceptional day trips, private itinerary and dedicated chauffeur.',
      es: 'El paseo de Deauville, el viejo puerto de Honfleur, los acantilados de Étretat y la Maravilla de Occidente — jornadas excepcionales con itinerario privado y chófer dedicado.',
      ru: 'Променад Довиля, старая гавань Онфлёра, скалы Этрета и Чудо Запада — исключительные однодневные поездки, частный маршрут и персональный шофёр.',
      ar: 'ممشى دوفيل وميناء أونفلور القديم ومنحدرات إتريتا وأعجوبة الغرب — أيام استثنائية بمسار خاص وسائق مخصص.',
    },
    prefill: 'Paris ⇄ Normandie (Deauville · Honfleur · Mont-Saint-Michel)',
  },
  {
    id: 'nice', image: '/dest-cannes.webp', size: 'std',
    region: { fr: 'Côte d’Azur', en: 'French Riviera', es: 'Costa Azul', ru: 'Лазурный берег', ar: 'الريفييرا الفرنسية' },
    name: { fr: 'Nice & Cannes', en: 'Nice & Cannes', es: 'Niza & Cannes', ru: 'Ницца и Канны', ar: 'نيس وكان' },
    desc: {
      fr: 'De l’aéroport de Nice à la Croisette : transferts, festivals et mises à disposition sur toute la Côte d’Azur.',
      en: 'From Nice airport to the Croisette: transfers, festivals and hourly hire across the Riviera.',
      es: 'Del aeropuerto de Niza a la Croisette: traslados, festivales y disposición por horas en toda la Costa Azul.',
      ru: 'Из аэропорта Ниццы на Круазетт: трансферы, фестивали и почасовая аренда по всему Лазурному берегу.',
      ar: 'من مطار نيس إلى الكروازيت: توصيلات ومهرجانات وخدمة بالساعة على امتداد الريفييرا.',
    },
    prefill: 'Nice (NCE) ⇄ Cannes',
  },
  {
    id: 'monaco', image: '/dest-monaco.webp', size: 'std',
    region: { fr: 'Principauté', en: 'Principality', es: 'Principado', ru: 'Княжество', ar: 'الإمارة' },
    name: { fr: 'Monaco', en: 'Monaco', es: 'Mónaco', ru: 'Монако', ar: 'موناكو' },
    desc: {
      fr: 'La Principauté par la corniche — un trajet spectaculaire entre mer et falaises, jusqu’à votre hôtel, le Casino ou le Yacht Club.',
      en: 'The Principality along the corniche — a spectacular drive between sea and cliffs, to your hotel, the Casino or the Yacht Club.',
      es: 'El Principado por la cornisa — un trayecto espectacular entre mar y acantilados, hasta su hotel, el Casino o el Yacht Club.',
      ru: 'Княжество по корнишу — впечатляющая дорога между морем и скалами, до отеля, казино или яхт-клуба.',
      ar: 'الإمارة عبر الكورنيش — رحلة خلابة بين البحر والمنحدرات حتى فندقك أو الكازينو أو نادي اليخوت.',
    },
    prefill: 'Nice (NCE) ⇄ Monaco',
  },
  {
    id: 'st-tropez', image: '/dest-saint-tropez.webp', size: 'std',
    region: { fr: 'Golfe de Saint-Tropez', en: 'Gulf of Saint-Tropez', es: 'Golfo de Saint-Tropez', ru: 'Залив Сен-Тропе', ar: 'خليج سان-تروبيه' },
    name: { fr: 'Saint-Tropez', en: 'Saint-Tropez', es: 'Saint-Tropez', ru: 'Сен-Тропе', ar: 'سان-تروبيه' },
    desc: {
      fr: 'Le port mythique et ses plages par l’Estérel — villas, palaces et soirées, votre chauffeur vous attend aussi tard que nécessaire.',
      en: 'The legendary port and its beaches through the Estérel — villas, palaces and evenings out, your chauffeur waits as late as needed.',
      es: 'El puerto mítico y sus playas por el Estérel — villas, grandes hoteles y veladas, su chófer espera hasta tan tarde como haga falta.',
      ru: 'Легендарный порт и его пляжи через Эстерель — виллы, отели и вечера; ваш шофёр ждёт столько, сколько нужно.',
      ar: 'الميناء الأسطوري وشواطئه عبر إستريل — فيلات وفنادق وسهرات، وسائقك ينتظر مهما تأخر الوقت.',
    },
    prefill: 'Nice ⇄ Saint-Tropez',
  },
];

export default function PricingTables({ onBook }: Props) {
  const { lang, t } = useI18n();
  const [info, setInfo] = useState<Destination | null>(null);
  const L = (v: L5) => pickL(lang, v);

  return (
    <section className="os-section os-dst" id="tarifs">
      <div className="os-container">
        <Reveal>
          <header className="os-dst__head">
            <div>
              <p className="os-eyebrow">{pickL(lang, { fr: 'Destinations', en: 'Destinations', es: 'Destinos', ru: 'Направления', ar: 'الوجهات' })}</p>
              <h2 className="os-dst__title">
                {pickL(lang, { fr: 'La France, porte à porte', en: 'France, door to door', es: 'Francia, puerta a puerta', ru: 'Франция — от двери до двери', ar: 'فرنسا، من الباب إلى الباب' })}
              </h2>
            </div>
            <p className="os-dst__lead">
              {pickL(lang, {
                fr: 'Neuf territoires que nos chauffeurs connaissent par cœur — choisissez le vôtre, nous nous occupons du reste.',
                en: 'Nine territories our chauffeurs know by heart — choose yours, we take care of the rest.',
                es: 'Nueve territorios que nuestros chóferes conocen de memoria — elija el suyo, nosotros nos ocupamos del resto.',
                ru: 'Девять территорий, которые наши шофёры знают наизусть — выберите свою, остальное мы берём на себя.',
                ar: 'تسع مناطق يعرفها سائقونا عن ظهر قلب — اختر وجهتك ونحن نتكفل بالباقي.',
              })}
            </p>
          </header>
        </Reveal>

        {/* Mosaïque éditoriale asymétrique */}
        <Reveal>
          <div className="os-dst__mosaic">
            {DESTINATIONS.map((d, i) => (
              <article key={d.id} className={`os-dst__tile os-dst__tile--${d.size}`}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => setInfo(d)} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setInfo(d)}>
                <img src={d.image} alt={L(d.name)} loading="lazy" />
                <div className="os-dst__scrim" aria-hidden />
                <span className="os-dst__region">{L(d.region)}</span>
                <div className="os-dst__body">
                  <h3>{L(d.name)}</h3>
                  <span className="os-dst__go">{pickL(lang, { fr: 'Découvrir', en: 'Discover', es: 'Descubrir', ru: 'Открыть', ar: 'اكتشف' })} →</span>
                </div>
              </article>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Fiche destination */}
      {info && (
        <div className="os-dpop" role="dialog" aria-modal aria-label={L(info.name)} onClick={() => setInfo(null)}>
          <div className="os-dpop__panel" onClick={(e) => e.stopPropagation()}>
            <button className="os-dpop__close" onClick={() => setInfo(null)} aria-label={t.common.close}>×</button>
            <div className="os-dpop__media">
              <img src={info.image} alt={L(info.name)} />
              <span className="os-dpop__chip">{L(info.region)}</span>
            </div>
            <div className="os-dpop__body">
              <h3 className="os-dpop__title">{L(info.name)}</h3>
              <p className="os-dpop__desc">{L(info.desc)}</p>
              <p className="os-dpop__note">
                {pickL(lang, {
                  fr: 'E-Class, V-Class ou S-Class — notre équipe vous confirme le tarif à la réservation.',
                  en: 'E-Class, V-Class or S-Class — our team confirms the fare upon booking.',
                  es: 'E-Class, V-Class o S-Class — nuestro equipo confirma la tarifa al reservar.',
                  ru: 'E-Class, V-Class или S-Class — тариф подтверждается при бронировании.',
                  ar: 'E-Class أو V-Class أو S-Class — يؤكد فريقنا السعر عند الحجز.',
                })}
              </p>
              <button className="os-btn os-btn--gold os-dpop__cta"
                onClick={() => { const p = info.prefill; setInfo(null); onBook(p); }}>
                {t.cta.book}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
