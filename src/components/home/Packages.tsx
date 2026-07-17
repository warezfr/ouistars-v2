import { useI18n } from '@/i18n';
import { ROUTE_RATES, VEHICLE_CLASSES } from '@/data/pricing';
import { formatEUR } from '@/lib/pricing';
import Reveal from '@/components/ui/Reveal';
import './sections.css';

interface Props { onBook: (prefill?: string) => void; }

/** Sélection de trajets signature depuis la grille officielle. */
const FEATURED = ['cdg-ory-lbg-paris', 'paris-disneyland', 'nce-monaco', 'paris-versailles', 'nice-st-tropez', 'paris-mont-saint-michel'];

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
        <div className="os-grid os-grid--packages">
          {routes.map((r) => (
            <Reveal key={r.id}>
              <article className="os-card os-pkg">
                <span className="os-pkg__cat">{r.category}</span>
                <div className="os-pkg__route">{r.label}</div>
                <div className="os-pkg__prices">
                  {(['E', 'V', 'S'] as const).map((c) => (
                    <span key={c}>{VEHICLE_CLASSES[c].name} <b>{formatEUR(r.prices[c])}</b></span>
                  ))}
                </div>
                <button className="os-btn os-btn--ghost" style={{ marginTop: 14 }}
                  onClick={() => onBook(r.label)}>{t.cta.book}</button>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
