import type { Field } from './types';

interface Props {
  field: Field;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
}

export default function FieldInput({ field, value, onChange, disabled }: Props) {
  const common = { id: field.name, disabled, required: field.required };

  return (
    <label className="adm-field">
      <span>{field.label}{field.required && ' *'}</span>

      {field.type === 'textarea' && (
        <textarea {...common} rows={4} placeholder={field.placeholder}
          value={(value as string) ?? ''} onChange={(e) => onChange(field.name, e.target.value)} />
      )}

      {field.type === 'select' && (
        <select {...common} value={(value as string) ?? ''} onChange={(e) => onChange(field.name, e.target.value)}>
          <option value="">—</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {field.type === 'boolean' && (
        <input type="checkbox" checked={Boolean(value)} disabled={disabled}
          onChange={(e) => onChange(field.name, e.target.checked)} />
      )}

      {field.type === 'number' && (
        <input {...common} type="number" placeholder={field.placeholder}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(field.name, e.target.value === '' ? null : Number(e.target.value))} />
      )}

      {(field.type === 'text' || field.type === 'image') && (
        <>
          <input {...common} type="text" placeholder={field.placeholder ?? (field.type === 'image' ? '/mon-image.webp ou https://…' : '')}
            value={(value as string) ?? ''} onChange={(e) => onChange(field.name, e.target.value)} />
          {field.type === 'image' && typeof value === 'string' && value && (
            <img className="adm-field__thumb" src={value} alt="" loading="lazy" />
          )}
        </>
      )}

      {field.help && <small className="adm-field__help">{field.help}</small>}
    </label>
  );
}
