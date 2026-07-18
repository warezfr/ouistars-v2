import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useI18n } from '@/i18n';
import { geocodeSearch, estimatePlaces, geolocate, type Place, type OneWayEstimate } from '@/lib/geocode';
import { VEHICLE_CLASSES, type VehicleClass } from '@/data/pricing';
import { formatEUR } from '@/lib/pricing';
import type { PoiType } from '@/data/locations';
import BookingWizard from '@/components/booking/BookingWizard';
import './calculator.css';

const CLASS_ORDER: VehicleClass[] = ['E', 'V', 'S'];

/**
 * Carte hero — étape 1 : Départ + Destination. Dès les deux saisis, on affiche
 * l'estimation (distance + prix), puis « Rechercher » ouvre le wizard.
 */
export default function FareCalculator() {
  const { t } = useI18n();
  const c = t.calculator;

  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [estimate, setEstimate] = useState<OneWayEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Estimation dès que départ + destination sont choisis.
  useEffect(() => {
    if (!from || !to) { setEstimate(null); setEstimating(false); return; }
    const ctrl = new AbortController();
    setEstimating(true);
    estimatePlaces(from, to, ctrl.signal)
      .then((e) => { setEstimate(e); setEstimating(false); })
      .catch(() => { if (!ctrl.signal.aborted) setEstimating(false); });
    return () => ctrl.abort();
  }, [from, to]);

  const ready = Boolean(from && to);

  return (
    <div className="os-calc os-calc--h" id="mobility">
      <div className="os-calc__head">
        <strong>{c.title}</strong>
        <span>{c.subtitleShort}</span>
      </div>

      <div className="os-calc__bar">
        <Autocomplete
          label={c.fromLabel} placeholder={c.fromPlaceholder}
          selected={from} noResults={c.noResults} searching={c.searching}
          onClear={() => setFrom(null)} onSelect={setFrom} locatable
        />
        <span className="os-calc__bar-arrow" aria-hidden>→</span>
        <Autocomplete
          label={c.toLabel} placeholder={c.toPlaceholder}
          selected={to} noResults={c.noResults} searching={c.searching}
          onClear={() => setTo(null)} onSelect={setTo}
        />
        <button className="os-btn os-btn--gold os-calc__search" onClick={() => ready && setWizardOpen(true)} disabled={!ready}>
          {c.search}
        </button>
      </div>

      {ready && (
        estimating ? (
          <p className="os-calc__hint os-calc__hint--h">{c.calculating}</p>
        ) : estimate && (
          <div className="os-calc__quote os-calc__quote--h">
            <div className="os-calc__quote-dist">
              <span>{c.estDistance}</span>
              <strong>≈ {estimate.distanceKm} {c.km}</strong>
            </div>
            <div className="os-calc__prices">
              {CLASS_ORDER.map((cls) => (
                <div key={cls} className="os-calc__price-card">
                  <span className="os-calc__price-name">{VEHICLE_CLASSES[cls].name}</span>
                  <span className="os-calc__price-from">{c.fromPrice}</span>
                  <strong className="os-calc__price-val">{formatEUR(estimate.prices[cls])}</strong>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {from && to && (
        <BookingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} ctx={{ from, to, estimate }} />
      )}
    </div>
  );
}

/* ————— Champ d'autocomplétion d'adresses (géocodage réel, débounce + abort) ————— */
interface AcProps {
  label: string;
  placeholder: string;
  selected: Place | null;
  noResults: string;
  searching: string;
  onClear: () => void;
  onSelect: (place: Place) => void;
  /** Affiche un bouton « Me localiser » (géolocalisation → adresse). */
  locatable?: boolean;
}

function Autocomplete({ label, placeholder, selected, noResults, searching, onClear, onSelect, locatable }: AcProps) {
  const [query, setQuery] = useState(selected?.label ?? '');
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  async function locateMe() {
    setLocating(true); setGeoError(null);
    try {
      const place = await geolocate();
      onSelect(place);
      setQuery(place.label);
      setOpen(false);
    } catch (e) {
      setGeoError((e as Error).message);
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => { if (selected) setQuery(selected.label); }, [selected]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const ctrl = new AbortController();
    setLoading(true);
    const id = window.setTimeout(() => {
      geocodeSearch(q, ctrl.signal)
        .then((r) => { setResults(r); setLoading(false); })
        .catch(() => { if (!ctrl.signal.aborted) setLoading(false); });
    }, 220);
    return () => { window.clearTimeout(id); ctrl.abort(); };
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (p: Place) => { onSelect(p); setQuery(p.label); setOpen(false); setHighlight(-1); };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); setHighlight(-1); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) { setOpen(true); return; } setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && open && highlight >= 0 && results[highlight]) { e.preventDefault(); pick(results[highlight]); }
  };

  return (
    <div className="os-calc__field os-ac" ref={wrapRef}>
      <span>{label}</span>
      <div className="os-ac__control">
        {selected && <PoiIcon type={selected.type} className="os-ac__lead" />}
        <input
          type="text" value={query} placeholder={placeholder}
          role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" autoComplete="off"
          className={selected ? 'os-ac__input--sel' : undefined}
          onChange={(e) => { setQuery(e.target.value); if (selected) onClear(); setOpen(true); setHighlight(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {locatable && (
          <button
            type="button" className="os-ac__locate" title="Me localiser" aria-label="Me localiser"
            disabled={locating}
            onClick={locateMe}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2"
              className={locating ? 'os-ac__locate-spin' : undefined} aria-hidden focusable="false">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
              <circle cx="12" cy="12" r="8" opacity="0.5" />
            </svg>
          </button>
        )}
      </div>
      {geoError && <small className="os-ac__geoerr">{geoError}</small>}
      {open && (
        <ul className="os-ac__list" id={listId} role="listbox">
          {loading && results.length === 0 && <li className="os-ac__empty">{searching}</li>}
          {!loading && results.length === 0 && <li className="os-ac__empty">{noResults}</li>}
          {results.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={`os-ac__item${i === highlight ? ' is-hl' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(p)}
              >
                <PoiIcon type={p.type} className="os-ac__icon" />
                <span className="os-ac__text">
                  <strong>{p.label}</strong>
                  <small>{p.sub}</small>
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
