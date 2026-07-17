import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useI18n } from '@/i18n';
import { geocodeSearch, type Place } from '@/lib/geocode';
import type { PoiType } from '@/data/locations';
import BookingWizard from '@/components/booking/BookingWizard';
import './calculator.css';

/**
 * Carte hero — étape 1 : seulement Départ + Destination.
 * Une fois les deux saisis, « Rechercher » ouvre le wizard (choix aller simple / mise à disposition, etc.).
 */
export default function FareCalculator() {
  const { t } = useI18n();
  const c = t.calculator;

  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const ready = Boolean(from && to);

  return (
    <div className="os-calc" id="mobility">
      <div className="os-calc__head">
        <strong>{c.title}</strong>
        <span>{c.subtitleShort}</span>
      </div>

      <div className="os-calc__od">
        <Autocomplete
          label={c.fromLabel} placeholder={c.fromPlaceholder}
          selected={from} noResults={c.noResults} searching={c.searching}
          onClear={() => setFrom(null)} onSelect={setFrom}
        />
        <span className="os-calc__od-arrow" aria-hidden>→</span>
        <Autocomplete
          label={c.toLabel} placeholder={c.toPlaceholder}
          selected={to} noResults={c.noResults} searching={c.searching}
          onClear={() => setTo(null)} onSelect={setTo}
        />
      </div>

      <button className="os-btn os-btn--gold os-calc__search" onClick={() => ready && setWizardOpen(true)} disabled={!ready}>
        {c.search}
      </button>

      {from && to && (
        <BookingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} ctx={{ from, to }} />
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
}

function Autocomplete({ label, placeholder, selected, noResults, searching, onClear, onSelect }: AcProps) {
  const [query, setQuery] = useState(selected?.label ?? '');
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

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
      </div>
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
