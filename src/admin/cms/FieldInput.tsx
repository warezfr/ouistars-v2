import { useEffect, useState, type KeyboardEvent } from 'react';
import type { Field, SuggestSource } from './types';
import RichText from './RichText';
import MediaUpload from './MediaUpload';
import Repeater from './Repeater';
import { listEntries } from './api';

/** Résout une source de saisie assistée en liste de propositions. */
function useSuggestions(source: SuggestSource | undefined): string[] {
  const [items, setItems] = useState<string[]>(Array.isArray(source) ? source : []);
  useEffect(() => {
    if (!source || Array.isArray(source)) { setItems(Array.isArray(source) ? source : []); return; }
    let cancel = false;
    (async () => {
      try {
        const rows = await listEntries(source.collection);
        if (cancel) return;
        const values = new Set<string>();
        for (const r of rows) {
          const v = r.data?.[source.field];
          if (typeof v === 'string' && v.trim()) {
            // décompose les valeurs multiples « FR, EN »
            v.split(',').map((x) => x.trim()).filter(Boolean).forEach((x) => values.add(x));
          }
        }
        setItems([...values].sort((a, b) => a.localeCompare(b, 'fr')));
      } catch { /* pas de suggestions */ }
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(source)]);
  return items;
}

/** Saisie multi-valeurs à puces (stockée « A, B, C ») avec suggestions. */
function TagsInput({ field, value, onChange, disabled }: {
  field: Field; value: unknown; onChange: (name: string, v: unknown) => void; disabled?: boolean;
}) {
  const suggestions = useSuggestions(field.suggest);
  const [draft, setDraft] = useState('');
  const tags = String(value ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  const commit = (next: string[]) => onChange(field.name, next.join(', '));

  const add = (raw: string) => {
    const t = raw.trim().replace(/,+$/, '');
    if (!t) return;
    if (!tags.some((x) => x.toLowerCase() === t.toLowerCase())) commit([...tags, t]);
    setDraft('');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft); }
    else if (e.key === 'Backspace' && !draft && tags.length) commit(tags.slice(0, -1));
  };
  const listId = `dl-${field.name}`;
  const remaining = suggestions.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <div className={`adm-tags form-control${disabled ? ' disabled' : ''}`}>
      {tags.map((t) => (
        <span key={t} className="badge text-bg-secondary adm-tags__chip">
          {t}
          {!disabled && (
            <button type="button" className="adm-tags__x" aria-label={`Retirer ${t}`}
              onClick={() => commit(tags.filter((x) => x !== t))}>×</button>
          )}
        </span>
      ))}
      {!disabled && (
        <>
          <input className="adm-tags__input" list={listId} value={draft}
            placeholder={tags.length ? '' : (field.placeholder ?? 'Ajouter…')}
            onChange={(e) => {
              const v = e.target.value;
              // sélection directe d'une suggestion → ajout immédiat
              if (remaining.some((s) => s === v)) add(v); else setDraft(v);
            }}
            onKeyDown={onKey} onBlur={() => add(draft)} />
          <datalist id={listId}>
            {remaining.map((s) => <option key={s} value={s} />)}
          </datalist>
        </>
      )}
    </div>
  );
}

/** Sélecteur alimenté par une autre collection (ex. marque, catégorie). */
function RefSelect({ field, value, onChange, disabled }: {
  field: Field; value: unknown; onChange: (name: string, v: unknown) => void; disabled?: boolean;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const rows = await listEntries(field.refCollection!);
        if (cancel) return;
        const lf = field.refLabelField ?? 'name';
        setOptions(rows.map((r) => {
          const label = (r.data?.[lf] as string) || r.title || r.slug || r.id.slice(0, 8);
          return { value: label, label };
        }));
      } catch { /* liste vide */ }
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.refCollection]);

  const current = (value as string) ?? '';
  const known = options.some((o) => o.value === current);
  return (
    <select id={field.name} className="form-select" disabled={disabled} value={current}
      onChange={(e) => onChange(field.name, e.target.value)}>
      <option value="">—</option>
      {!known && current && <option value={current}>{current}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

interface Props {
  field: Field;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
}

export default function FieldInput({ field, value, onChange, disabled }: Props) {
  const label = <label htmlFor={field.name} className="form-label">{field.label}{field.required && ' *'}</label>;
  const textSuggestions = useSuggestions(field.type === 'text' ? field.suggest : undefined);

  if (field.type === 'boolean') {
    return (
      <div className="form-check mt-2">
        <input className="form-check-input" type="checkbox" id={field.name}
          checked={Boolean(value)} disabled={disabled}
          onChange={(e) => onChange(field.name, e.target.checked)} />
        <label className="form-check-label" htmlFor={field.name}>{field.label}</label>
      </div>
    );
  }

  return (
    <div>
      {label}

      {field.type === 'textarea' && (
        <textarea id={field.name} className="form-control" rows={4} disabled={disabled}
          placeholder={field.placeholder} value={(value as string) ?? ''}
          onChange={(e) => onChange(field.name, e.target.value)} />
      )}

      {field.type === 'richtext' && (
        <RichText value={(value as string) ?? ''} disabled={disabled}
          onChange={(html) => onChange(field.name, html)} />
      )}

      {field.type === 'repeater' && (
        <Repeater field={field} value={value} onChange={onChange} disabled={disabled} />
      )}

      {field.type === 'image' && (
        <MediaUpload value={(value as string) ?? ''} disabled={disabled} placeholder={field.placeholder}
          onChange={(url) => onChange(field.name, url)} />
      )}

      {field.type === 'select' && (
        <select id={field.name} className="form-select" disabled={disabled}
          value={(value as string) ?? ''} onChange={(e) => onChange(field.name, e.target.value)}>
          <option value="">—</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {field.type === 'ref' && (
        <RefSelect field={field} value={value} onChange={onChange} disabled={disabled} />
      )}

      {field.type === 'date' && (
        <input id={field.name} type="date" className="form-control" disabled={disabled}
          value={(value as string) ?? ''} onChange={(e) => onChange(field.name, e.target.value)} />
      )}

      {field.type === 'number' && (
        <input id={field.name} type="number" className="form-control" disabled={disabled}
          placeholder={field.placeholder}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(field.name, e.target.value === '' ? null : Number(e.target.value))} />
      )}

      {field.type === 'text' && (
        <>
          <input id={field.name} type="text" className="form-control" disabled={disabled}
            placeholder={field.placeholder} value={(value as string) ?? ''}
            list={textSuggestions.length ? `dl-${field.name}` : undefined}
            onChange={(e) => onChange(field.name, e.target.value)} />
          {textSuggestions.length > 0 && (
            <datalist id={`dl-${field.name}`}>
              {textSuggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
          )}
        </>
      )}

      {field.type === 'tags' && (
        <TagsInput field={field} value={value} onChange={onChange} disabled={disabled} />
      )}

      {field.help && <small className="text-muted d-block mt-1">{field.help}</small>}
    </div>
  );
}
