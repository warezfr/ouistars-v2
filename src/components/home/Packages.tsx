import { useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { ROUTE_RATES, VEHICLE_CLASSES, type RouteRate } from '@/data/pricing';
import { formatEUR } from '@/lib/pricing';
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

/** Notices destination (popup d'information). */
const ROUTE_INFO: Record<string, { fr: string; en: string }> = {
  'cdg-ory-lbg-paris': {
    fr: 'Transferts entre les aéroports parisiens (CDG, Orly, Le Bourget) et le cœur de Paris — accueil pancarte, suivi des vols et attente incluse.',
    en: 'Transfers between Paris airports (CDG, Orly, Le Bourget) and central Paris — name-board welcome, flight tracking and waiting included.',
  },
  'paris-disneyland': {
    fr: 'Rejoignez Disneyland Paris depuis le centre de Paris en tout confort — idéal pour les familles, sièges enfants sur simple demande.',
    en: 'Reach Disneyland Paris from central Paris in full comfort — perfect for families, child seats on request.',
  },
  'nce-monaco': {
    fr: 'De l’aéroport de Nice à la Principauté par la corniche — un trajet spectaculaire entre mer et falaises, jusqu’à votre hôtel ou le Casino.',
    en: 'From Nice airport to the Principality along the corniche — a spectacular drive between sea and cliffs, to your hotel or the Casino.',
  },
  'paris-versailles': {
    fr: 'Le château de Versailles à 40 minutes de Paris — mise à disposition possible pendant votre visite, retour quand vous le souhaitez.',
    en: 'The Palace of Versailles, 40 minutes from Paris — chauffeur at disposal during your visit, return whenever you wish.',
  },
  'nice-st-tropez': {
    fr: 'La Côte d’Azur dans toute sa splendeur : de Nice au golfe de Saint-Tropez, par l’Estérel et ses panoramas.',
    en: 'The Riviera at its finest: from Nice to the Gulf of Saint-Tropez, through the Estérel and its panoramas.',
  },
  'paris-mont-saint-michel': {
    fr: 'Journée d’exception vers la Merveille de l’Occident — itinéraire privé, arrêts à la demande, chauffeur dédié toute la journée.',
    en: 'An exceptional day trip to the Wonder of the West — private itinerary, stops on request, dedicated chauffeur all day.',
  },
};

/** Itinéraires signature — vitrine large à défilement automatique + popup destination. */
export default function Packages({ onBook }: Props) {
  usePricingSync();
  const { t, lang } = useI18n();
  const routes = ROUTE_RATES.filter((r) => FEATURED.includes(r.id));
  const railRef = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState<RouteRate | null>(null);
  useAutoScroll(railRef, { speed: 0.5, paused: info !== null });

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
            <span className="os-pk__hint">{lang === 'fr' ? 'Cliquez sur une destination' : 'Click a destination'}</span>
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
              <img src={ROUTE_IMAGES[r.id] ?? FALLBACK_IMAGE} alt={r.label} loading="lazy" />
              <div className="os-pk__scrim" aria-hidden />
              <span className="os-pk__num">{String((i % routes.length) + 1).padStart(2, '0')}</span>
              <div className="os-pk__body">
                <h3 className="os-pk__route">{r.label}</h3>
                <div className="os-pk__prices">
                  {(['E', 'V', 'S'] as const).map((c) => (
                    <span key={c}>
                      <small>{VEHICLE_CLASSES[c].name}</small>
                      <b>{formatEUR(r.prices[c])}</b>
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Reveal>

      {/* Popup destination */}
      {info && (
        <div className="os-dpop" role="dialog" aria-modal onClick={() => setInfo(null)}>
          <div className="os-dpop__panel" onClick={(e) => e.stopPropagation()}>
            <button className="os-dpop__close" onClick={() => setInfo(null)} aria-label={t.common.close}>×</button>
            <div className="os-dpop__media">
              <img src={ROUTE_IMAGES[info.id] ?? FALLBACK_IMAGE} alt={info.label} />
              <span className="os-dpop__chip">{t.pricingTables.categories[info.category]}</span>
            </div>
            <div className="os-dpop__body">
              <h3 className="os-dpop__title">{info.label}</h3>
              <p className="os-dpop__desc">{ROUTE_INFO[info.id]?.[lang] ?? ''}</p>
              <div className="os-dpop__rates">
                {(['E', 'V', 'S'] as const).map((c) => (
                  <div key={c} className="os-dpop__rate">
                    <span>{VEHICLE_CLASSES[c].name}<small>{VEHICLE_CLASSES[c].example}</small></span>
                    <b>{formatEUR(info.prices[c])}</b>
                  </div>
                ))}
              </div>
              <p className="os-dpop__note">{lang === 'fr' ? 'Prix TTC, par transfert dans un sens ou dans l’autre.' : 'Prices incl. VAT, per one-way transfer.'}</p>
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
