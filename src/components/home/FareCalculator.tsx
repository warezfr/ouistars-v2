import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useI18n } from '@/i18n';
import { searchLocations, estimateOneWay, estimateHourly } from '@/lib/estimate';
import { HOURLY_MIN_HOURS, VEHICLE_CLASSES, type VehicleClass } from '@/data/pricing';
import { formatEUR } from '@/lib/pricing';
import type { Poi, PoiType } from '@/data/locations';
import BookingWizard, { type BookingContext } from '@/components/booking/BookingWizard';
import './calculator.css';

type Tab = 'oneway' | 'hourly';

const CLASS_ORDER: VehicleClass[] = ['E', 'V', 'S'];

/** Formulaire de réservation intelligent — onglets One Way / Hourly + autocomplétion. */
export default function FareCalculator() {
  const { t } = useI18n();
  const c = t.calculator;

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [tab, setTab] = useState<Tab>('oneway');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('10:00');
  const [hours, setHours] = useState(HOURLY_MIN_HOURS);

  const [from, setFrom] = useState<Poi | null>(null);
  const [fromQuery, setFromQuery] = useState('');
  const [to, setTo] = useState<Poi | null>(null);
  const [toQuery, setToQuery] = useState('');

  const [wizardOpen, setWizardOpen] = useState(false);

  const oneWay = useMemo(() => (from && to ? estimateOneWay(from, to) : null), [from, to]);
  const hourly = useMemo(() => estimateHourly(hours), [hours]);

  const canSearch = tab === 'oneway' ? Boolean(from && to) : Boolean(from);

  const ctx: BookingContext | null = useMemo(() => {
    if (tab === 'oneway') {
      if (!from || !to || !oneWay) return null;
      return {
        mode: 'oneway', from, to, date, time,
        prices: oneWay.prices, distanceKm: oneWay.distanceKm, routeLabel: oneWay.routeLabel,
      };
    }
    if (!from) return null;
    return { mode: 'hourly', from, date, time, hours: hourly.hours, prices: hourly.prices };
  }, [tab, from, to, oneWay, hourly, date, time]);

  const openWizard = () => { if (ctx) setWizardOpen(true); };

  return (
    <div className="os-calc" id="mobility">
      <div className="os-calc__head">
        <strong>{c.title}</strong>
        <span>{c.subtitle}</span>
      </div>

      {/* Onglets */}
      <div className="os-calc__tabs" role="tablist" aria-label={c.title}>
        <button
          role="tab" aria-selected={tab === 'oneway'}
          className={`os-calc__tab${tab === 'oneway' ? ' is-active' : ''}`}
          onClick={() => setTab('oneway')}
        >
          {c.tabOneWay}
        </button>
        <button
          role="tab" aria-selected={tab === 'hourly'}
          className={`os-calc__tab${tab === 'hourly' ? ' is-active' : ''}`}
          onClick={() => setTab('hourly')}
        >
          {c.tabHourly}
        </button>
      </div>

      <div className="os-calc__row os-calc__row--dt">
        <label className="os-calc__field">
          <span>{c.date}</span>
          <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="os-calc__field">
          <span>{c.time}</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      <Autocomplete
        label={c.fromLabel}
        placeholder={c.fromPlaceholder}
        query={fromQuery}
        selected={from}
        noResults={c.noResults}
        onQueryChange={(v) => { setFromQuery(v); setFrom(null); }}
        onSelect={(p) => { setFrom(p); setFromQuery(p.label); }}
      />

      {tab === 'oneway' ? (
        <Autocomplete
          label={c.toLabel}
          placeholder={c.toPlaceholder}
          query={toQuery}
          selected={to}
          noResults={c.noResults}
          onQueryChange={(v) => { setToQuery(v); setTo(null); }}
          onSelect={(p) => { setTo(p); setToQuery(p.label); }}
        />
      ) : (
        <label className="os-calc__field">
          <span>{c.duration}</span>
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
            {Array.from({ length: 10 }, (_, i) => i + HOURLY_MIN_HOURS).map((h) => (
              <option key={h} value={h}>{c.hoursOption.replace('{n}', String(h))}</option>
            ))}
          </select>
        </label>
      )}

      {/* Mini-récap prix */}
      {tab === 'oneway' && oneWay && (
        <div className="os-calc__quote">
          <div className="os-calc__quote-dist">
            <span>{c.estDistance}</span>
            <strong>≈ {oneWay.distanceKm} {c.km}</strong>
          </div>
          <PriceRow prices={oneWay.prices} fromLabel={c.fromPrice} />
        </div>
      )}
      {tab === 'hourly' && (
        <div className="os-calc__quote">
          <PriceRow prices={hourly.prices} fromLabel={c.fromPrice} suffix={` ${c.perHour}`} />
        </div>
      )}
      {tab === 'oneway' && !oneWay && (
        <p className="os-calc__hint">{c.fillBoth}</p>
      )}

      <button className="os-btn os-btn--gold os-calc__search" onClick={openWizard} disabled={!canSearch}>
        {c.search}
      </button>

      {ctx && <BookingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} ctx={ctx} />}
    </div>
  );
}

function PriceRow({ prices, fromLabel, suffix }: { prices: Record<VehicleClass, number>; fromLabel: string; suffix?: string }) {
  return (
    <div className="os-calc__prices">
      {CLASS_ORDER.map((cls) => (
        <div key={cls} className="os-calc__price-card">
          <span className="os-calc__price-name">{VEHICLE_CLASSES[cls].name}</span>
          <span className="os-calc__price-from">{fromLabel}</span>
          <strong className="os-calc__price-val">{formatEUR(prices[cls])}{suffix ?? ''}</strong>
        </div>
      ))}
    </div>
  );
}

/* ————— Champ d'autocomplétion ————— */
interface AcProps {
  label: string;
  placeholder: string;
  query: string;
  selected: Poi | null;
  noResults: string;
  onQueryChange: (value: string) => void;
  onSelect: (poi: Poi) => void;
}

function Autocomplete({ label, placeholder, query, selected, noResults, onQueryChange, onSelect }: AcProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = useMemo(() => (open ? searchLocations(query) : []), [open, query]);

  // Ferme au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (poi: Poi) => { onSelect(poi); setOpen(false); setHighlight(-1); };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); setHighlight(-1); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && open && highlight >= 0 && results[highlight]) {
      e.preventDefault();
      pick(results[highlight]);
    }
  };

  return (
    <div className="os-calc__field os-ac" ref={wrapRef}>
      <span>{label}</span>
      <div className="os-ac__control">
        {selected && <PoiIcon type={selected.type} className="os-ac__lead" />}
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          className={selected ? 'os-ac__input--sel' : undefined}
          onChange={(e) => { onQueryChange(e.target.value); setOpen(true); setHighlight(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && (
        <ul className="os-ac__list" id={listId} role="listbox">
          {results.length === 0 && <li className="os-ac__empty">{noResults}</li>}
          {results.map((poi, i) => (
            <li key={poi.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={`os-ac__item${i === highlight ? ' is-hl' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(poi)}
              >
                <PoiIcon type={poi.type} className="os-ac__icon" />
                <span className="os-ac__text">
                  <strong>{poi.label}</strong>
                  <small>{poi.sub}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PoiIcon({ type, className }: { type: PoiType; className?: string }) {
  const paths: Record<PoiType, ReactElement> = {
    airport: <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z" />,
    station: <path d="M12 2c-4 0-8 .5-8 4v9.5A3.5 3.5 0 0 0 7.5 19L6 20.5V21h2l2-2h4l2 2h2v-.5L16.5 19a3.5 3.5 0 0 0 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17A1.5 1.5 0 1 1 9 15.5 1.5 1.5 0 0 1 7.5 17zm3.5-7H6V6h5zm2 0V6h5v4zm3.5 7a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z" />,
    landmark: <path d="M12 2 2 8v2h20V8L12 2zM4 11v7H2v2h20v-2h-2v-7h-2v7h-3v-7h-2v7H9v-7H7v7H6v-7H4z" />,
    city: <path d="M3 21V9l6-4v3l6-4v5h6v12H3zm4-2h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V9H7v2zm6 8h2v-2h-2v2zm0-4h2v-2h-2v2zm4 4h2v-2h-2v2zm0-4h2v-2h-2v2z" />,
  };
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden focusable="false">
      {paths[type]}
    </svg>
  );
}
