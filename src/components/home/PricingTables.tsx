import { useI18n } from '@/i18n';
import {
  ROUTE_RATES,
  HOURLY_RATES,
  HOURLY_MIN_HOURS,
  PER_KM_RATES,
  PRICING_NOTES,
  PRICE_LIST_VERSION,
  VEHICLE_CLASSES,
  type RouteCategory,
  type VehicleClass,
} from '@/data/pricing';
import { formatEUR } from '@/lib/pricing';
import { usePricingSync } from '@/lib/livePricing';
import Reveal from '@/components/ui/Reveal';
import './pricing-tables.css';

interface Props { onBook: (prefill?: string) => void; }

const CATEGORY_ORDER: RouteCategory[] = ['airport', 'city', 'station', 'tour', 'riviera', 'city-to-city'];
const CLASSES: VehicleClass[] = ['E', 'V', 'S'];

/** Format €/km avec décimales (formatEUR arrondit à l'euro). */
const formatPerKm = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(n);

export default function PricingTables({ onBook }: Props) {
  usePricingSync(); // re-rend la grille quand le back-office a été synchronisé
  const { t } = useI18n();
  const pt = t.pricingTables;

  // Catégories réellement présentes (dans l'ordre) pour les ancres de navigation.
  const activeCats = CATEGORY_ORDER.filter((cat) => ROUTE_RATES.some((r) => r.category === cat));

  return (
    <section className="os-section os-pt" id="tarifs">
      <div className="os-container">
        <Reveal>
          <p className="os-eyebrow">{pt.eyebrow}</p>
          <div className="os-pt__head">
            <h2>{pt.title}</h2>
            <span className="os-pt__badge">{pt.badge} {PRICE_LIST_VERSION}</span>
          </div>
          <p className="os-lead os-pt__sub">{pt.subtitle}</p>
          <nav className="os-pt__anchors" aria-label={pt.title}>
            {activeCats.map((cat) => (
              <a key={cat} href={`#tarifs-${cat}`} className="os-pt__anchor">{pt.categories[cat]}</a>
            ))}
          </nav>
        </Reveal>

        {activeCats.map((cat) => {
          const routes = ROUTE_RATES.filter((r) => r.category === cat);
          return (
            <Reveal key={cat}>
              <div className="os-pt__group" id={`tarifs-${cat}`}>
                <h3 className="os-pt__cat">{pt.categories[cat]}</h3>
                <div className="os-pt__scroll">
                  <table className="os-pt__table">
                    <thead>
                      <tr>
                        <th>{pt.colRoute}</th>
                        {CLASSES.map((c) => (
                          <th key={c} className="os-pt__num">{VEHICLE_CLASSES[c].name}</th>
                        ))}
                        <th className="os-pt__actioncol" aria-label={pt.book} />
                      </tr>
                    </thead>
                    <tbody>
                      {routes.map((r) => (
                        <tr key={r.id}>
                          <td className="os-pt__route">{r.label}</td>
                          {CLASSES.map((c) => (
                            <td key={c} className="os-pt__price">{formatEUR(r.prices[c])}</td>
                          ))}
                          <td className="os-pt__action">
                            <button
                              className="os-btn os-btn--ghost os-pt__book"
                              onClick={() => onBook(r.label)}
                            >
                              {pt.book}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          );
        })}

        <div className="os-pt__duo">
          <Reveal>
            <div className="os-card os-pt__aux">
              <h3>{pt.hourlyTitle}</h3>
              <p className="os-pt__auxnote">
                {pt.hourlyNote.replace('{h}', String(HOURLY_MIN_HOURS))}
              </p>
              <div className="os-pt__rates">
                {CLASSES.map((c) => (
                  <div className="os-pt__rate" key={c}>
                    <span>{VEHICLE_CLASSES[c].name} · {VEHICLE_CLASSES[c].example}</span>
                    <b>{formatEUR(HOURLY_RATES[c])} <small>{pt.perHour}</small></b>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="os-card os-pt__aux">
              <h3>{pt.perKmTitle}</h3>
              <p className="os-pt__auxnote">{pt.perKmNote}</p>
              <div className="os-pt__rates">
                {CLASSES.map((c) => (
                  <div className="os-pt__rate" key={c}>
                    <span>{VEHICLE_CLASSES[c].name} · {VEHICLE_CLASSES[c].example}</span>
                    <b><small>{pt.from}</small> {formatPerKm(PER_KM_RATES[c])} <small>{pt.perKm}</small></b>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="os-pt__notes">
            <h4>{pt.notesTitle}</h4>
            <ul>
              {PRICING_NOTES.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
