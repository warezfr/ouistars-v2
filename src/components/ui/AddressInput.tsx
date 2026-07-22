import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { geocodeSearch, geolocate, type Place } from '@/lib/geocode';
import './address.css';

export interface AddressInputProps {
  /** Nom du champ (sérialisé via FormData comme un input classique). */
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  /** Classe du champ (ex. form-control pour AdminLTE). */
  inputClassName?: string;
  /** Callback facultatif quand une adresse est choisie (avec coordonnées). */
  onPlace?: (p: Place) => void;
  /** Variante claire pour le back-office (AdminLTE). */
  light?: boolean;
}

/**
 * Champ adresse avec saisie assistée (géocodage) et bouton « Me localiser ».
 * Compatible formulaires non contrôlés : la valeur vit dans l'input nommé.
 */
export default function AddressInput({
  name, placeholder, required, defaultValue, inputClassName, onPlace, light,
}: AddressInputProps) {
  const [query, setQuery] = useState(defaultValue ?? '');
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const ctrl = new AbortController();
    const id = window.setTimeout(() => {
      geocodeSearch(q, ctrl.signal).then(setResults).catch(() => {});
    }, 220);
    return () => { window.clearTimeout(id); ctrl.abort(); };
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const pick = (p: Place) => {
    setQuery(p.sub ? `${p.label}, ${p.sub}` : p.label);
    setOpen(false); setHighlight(-1);
    onPlace?.(p);
  };

  async function locateMe() {
    setLocating(true);
    try { pick(await geolocate()); } catch { /* refus géoloc : silencieux */ }
    finally { setLocating(false); }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && open && highlight >= 0 && results[highlight]) { e.preventDefault(); pick(results[highlight]); }
  };

  return (
    <div className={`os-adr${light ? ' os-adr--light' : ''}`} ref={wrapRef}>
      <input
        type="text" name={name} value={query} placeholder={placeholder} required={required}
        className={inputClassName} autoComplete="off"
        role="combobox" aria-expanded={open} aria-autocomplete="list"
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlight(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <button type="button" className="os-adr__locate" title="Me localiser" aria-label="Me localiser"
        disabled={locating} onClick={locateMe}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
          className={locating ? 'os-adr__spin' : undefined} aria-hidden focusable="false">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
          <circle cx="12" cy="12" r="8" opacity="0.5" />
        </svg>
      </button>
      {open && results.length > 0 && (
        <ul className="os-adr__list" role="listbox">
          {results.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === highlight}>
              <button type="button" className={i === highlight ? 'is-hl' : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(p)}>
                <strong>{p.label}</strong>
                {p.sub && <small>{p.sub}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
