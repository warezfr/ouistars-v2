import { useI18n } from '@/i18n';
import { ROUTE_RATES, VEHICLE_CLASSES } from '@/data/pricing';
import { formatEUR } from '@/lib/pricing';
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

export default function Packages({ onBook }: Props) {
  const { t } = useI18n();
  const routes = ROUTE_RATES.filter((r) => FEATURED.includes(r.id));
  return (
    <section className="os-section" id="tours">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{t.packages.eyebrow}</p>
          <h2>{t.packages.title}</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {routes.map((r) => (
            <Reveal key={r.id}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold-deep/20 bg-surface/60 transition-colors duration-500 hover:border-gold-deep/60">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={ROUTE_IMAGES[r.id] ?? FALLBACK_IMAGE}
                    alt={r.label}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/25 to-transparent" aria-hidden />
                  <span className="absolute left-4 top-4 rounded-full border border-gold-deep/60 bg-night/60 px-3 py-1 text-[0.62rem] uppercase tracking-[0.18em] text-gold backdrop-blur-sm">
                    {r.category}
                  </span>
                  <div className="absolute inset-x-5 bottom-4 font-display text-[1.3rem] leading-tight text-ivory">
                    {r.label}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {(['E', 'V', 'S'] as const).map((c) => (
                      <span key={c} className="text-[0.85rem] text-ivory/60">
                        {VEHICLE_CLASSES[c].name} <b className="font-display text-[1.05rem] text-gold-soft">{formatEUR(r.prices[c])}</b>
                      </span>
                    ))}
                  </div>
                  <button
                    className="os-btn os-btn--ghost mt-5 self-start"
                    onClick={() => onBook(r.label)}
                  >
                    {t.cta.book}
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
