import type { Field } from './types';

/**
 * Répéteur : édite une liste d'objets (ex. inclusions d'un forfait, chiffres clés).
 * Chaque ligne contient les `subfields` définis dans la configuration.
 */
interface Props {
  field: Field;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
}

type Row = Record<string, unknown>;

export default function Repeater({ field, value, onChange, disabled }: Props) {
  const rows: Row[] = Array.isArray(value) ? (value as Row[]) : [];
  const subs = field.subfields ?? [{ name: 'label', label: 'Valeur', type: 'text' as const }];

  const update = (next: Row[]) => onChange(field.name, next);
  const setCell = (i: number, key: string, v: unknown) =>
    update(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const add = () => update([...rows, {}]);
  const remove = (i: number) => update(rows.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  return (
    <div className="adm-rep">
      <div className="adm-rep__rows">
        {rows.length === 0 && <p className="adm-rep__empty">Aucune ligne.</p>}
        {rows.map((row, i) => (
          <div className="adm-rep__row" key={i}>
            <div className="adm-rep__fields">
              {subs.map((sf) => (
                <input
                  key={sf.name}
                  className="adm-rep__input"
                  type={sf.type === 'number' ? 'number' : 'text'}
                  placeholder={sf.placeholder ?? sf.label}
                  disabled={disabled}
                  value={(row[sf.name] as string) ?? ''}
                  onChange={(e) =>
                    setCell(i, sf.name, sf.type === 'number' ? Number(e.target.value) : e.target.value)}
                />
              ))}
            </div>
            {!disabled && (
              <div className="adm-rep__ctrls">
                <button type="button" title="Monter" onClick={() => move(i, -1)}>↑</button>
                <button type="button" title="Descendre" onClick={() => move(i, 1)}>↓</button>
                <button type="button" title="Supprimer" className="adm-danger" onClick={() => remove(i)}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {!disabled && <button type="button" className="adm-rep__add" onClick={add}>+ Ajouter une ligne</button>}
    </div>
  );
}
