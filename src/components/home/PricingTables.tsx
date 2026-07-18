import { useState } from 'react';
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

/** City-to-city en tête (consigne), puis le reste de la grille. */
const CATEGORY_ORDER: RouteCategory[] = ['city-to-city', 'airport', 'city', 'station', 'tour', 'riviera'];
const CLASSES: VehicleClass[] = ['E', 'V', 'S'];

/** Format €/km avec décimales (formatEUR arrondit à l'euro). */
const formatPerKm = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(n);

/** Grille tarifaire compacte : onglets par catégorie (une table visible à la
    fois) + panneau latéral horaire / km + conditions repliées. */
export default function PricingTables({ onBook }: Props) {
  usePricingSync(); // re-rend la grille quand le back-office a été synchronisé
  const { t } = useI18n();
  const pt = t.pricingTables;

  const activeCats = CATEGORY_ORDER.filter((cat) => ROUTE_RATES.some((r) => r.category === cat));
  const [cat, setCat] = useState<RouteCategory>(activeCats[0] ?? 'airport');
  const routes = ROUTE_RATES.filter((r) => r.category === cat);

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

          {/* Onglets catégories — une seule table visible à la fois */}
          <div className="os-pt__tabs" role="tablist" aria-label={pt.title}>
            {activeCats.map((c) => (
              <button key={c} type="button" role="tab" aria-selected={c === cat}
                className={`os-pt__tab${c === cat ? ' is-active' : ''}`}
                onClick={() => setCat(c)}>
                {pt.categories[c]}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="os-pt__layout">
          {/* Table de la catégorie sélectionnée */}
          <div className="os-pt__scroll" key={cat}>
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
                      <button className="os-btn os-btn--ghost os-pt__book" onClick={() => onBook(r.label)}>
                        {pt.book}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Panneau latéral : mise à disposition + au kilomètre */}
          <aside className="os-pt__side">
            <div className="os-pt__aux">
              <h3>{pt.hourlyTitle}</h3>
              <p className="os-pt__auxnote">{pt.hourlyNote.replace('{h}', String(HOURLY_MIN_HOURS))}</p>
              <div className="os-pt__rates">
                {CLASSES.map((c) => (
                  <div className="os-pt__rate" key={c}>
                    <span>{VEHICLE_CLASSES[c].name}</span>
                    <b>{formatEUR(HOURLY_RATES[c])} <small>{pt.perHour}</small></b>
                  </div>
                ))}
              </div>
            </div>
            <div className="os-pt__aux">
              <h3>{pt.perKmTitle}</h3>
              <p className="os-pt__auxnote">{pt.perKmNote}</p>
              <div className="os-pt__rates">
                {CLASSES.map((c) => (
                  <div className="os-pt__rate" key={c}>
                    <span>{VEHICLE_CLASSES[c].name}</span>
                    <b><small>{pt.from}</small> {formatPerKm(PER_KM_RATES[c])} <small>{pt.perKm}</small></b>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Conditions repliées — n'occupe qu'une ligne fermée */}
        <Reveal>
          <details className="os-pt__conditions">
            <summary>{pt.notesTitle}<span aria-hidden>+</span></summary>
            <ul>
              {PRICING_NOTES.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </details>
        </Reveal>
      </div>
    </section>
  );
}
