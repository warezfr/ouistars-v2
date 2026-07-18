import { useRef } from 'react';
import { useI18n } from '@/i18n';
import { ROUTE_RATES, VEHICLE_CLASSES } from '@/data/pricing';
import { formatEUR } from '@/lib/pricing';
import { usePricingSync } from '@/lib/livePricing';
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

/** Itinéraires signature — rail horizontal compact (cartes « carnet de voyage »). */
export default function Packages({ onBook }: Props) {
  usePricingSync();
  const { t } = useI18n();
  const routes = ROUTE_RATES.filter((r) => FEATURED.includes(r.id));
  const railRef = useRef<HTMLDivElement>(null);
  const nudge = (dir: number) =>
    railRef.current?.scrollBy({ left: dir * (railRef.current.clientWidth * 0.7), behavior: 'smooth' });

  return (
    <section className="os-section os-pk" id="tours">
      <div className="os-container">
        <Reveal>
          <div className="os-pk__head">
            <div>
              <p className="os-eyebrow">{t.packages.eyebrow}</p>
              <h2 className="os-pk__title">{t.packages.title}</h2>
            </div>
            <div className="os-pk__nav" aria-hidden>
              <button type="button" className="os-pk__arrow" onClick={() => nudge(-1)} aria-label="Précédent">←</button>
              <button type="button" className="os-pk__arrow" onClick={() => nudge(1)} aria-label="Suivant">→</button>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="os-pk__rail" ref={railRef}>
            {routes.map((r, i) => (
              <article key={r.id} className="os-pk__card">
                <img src={ROUTE_IMAGES[r.id] ?? FALLBACK_IMAGE} alt={r.label} loading="lazy" />
                <div className="os-pk__scrim" aria-hidden />
                <span className="os-pk__num">{String(i + 1).padStart(2, '0')}</span>
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
                  <button type="button" className="os-pk__book" onClick={() => onBook(r.label)}>
                    {t.cta.book} →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
