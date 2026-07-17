import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { ROUTE_RATES, VEHICLE_CLASSES, type VehicleClass } from '@/data/pricing';
import { computeFare, formatEUR } from '@/lib/pricing';
import './calculator.css';

interface Props { onBook: (prefill?: string) => void; }

/** Calculateur de tarifs public — branché sur la grille officielle 2026-2027. */
export default function FareCalculator({ onBook }: Props) {
  const { t } = useI18n();
  const [routeId, setRouteId] = useState(ROUTE_RATES[0].id);
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('E');
  const [passengers, setPassengers] = useState(2);

  const fare = useMemo(
    () => computeFare({ routeId, vehicleClass, passengers }),
    [routeId, vehicleClass, passengers],
  );

  const route = ROUTE_RATES.find((r) => r.id === routeId);

  return (
    <div className="os-calc" id="mobility">
      <div className="os-calc__head">
        <strong>{t.calculator.title}</strong>
        <span>{t.calculator.subtitle}</span>
      </div>

      <label className="os-calc__field">
        <span>{t.calculator.route}</span>
        <select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
          {ROUTE_RATES.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </label>

      <div className="os-calc__row">
        <label className="os-calc__field">
          <span>{t.calculator.vehicle}</span>
          <select value={vehicleClass} onChange={(e) => setVehicleClass(e.target.value as VehicleClass)}>
            {(Object.keys(VEHICLE_CLASSES) as VehicleClass[]).map((c) => (
              <option key={c} value={c}>
                {VEHICLE_CLASSES[c].name} · {VEHICLE_CLASSES[c].seats} pax
              </option>
            ))}
          </select>
        </label>
        <label className="os-calc__field os-calc__field--sm">
          <span>{t.calculator.passengers}</span>
          <input type="number" min={1} max={12} value={passengers}
            onChange={(e) => setPassengers(Math.max(1, Number(e.target.value) || 1))} />
        </label>
      </div>

      <div className="os-calc__result">
        <div>
          <span className="os-calc__result-label">{t.calculator.from}</span>
          <strong className="os-calc__price">{fare ? formatEUR(fare.amount) : '—'}</strong>
          <small>TTC · {route?.label}</small>
        </div>
        <button className="os-btn os-btn--gold"
          onClick={() => onBook(route ? `${route.label} — ${VEHICLE_CLASSES[vehicleClass].name}` : '')}>
          {t.calculator.book}
        </button>
      </div>
    </div>
  );
}
