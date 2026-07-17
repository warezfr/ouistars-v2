import type { Field } from './types';
import RichText from './RichText';
import MediaUpload from './MediaUpload';
import Repeater from './Repeater';

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

      {field.type === 'text' && (
        <input {...common} type="text" placeholder={field.placeholder}
          value={(value as string) ?? ''} onChange={(e) => onChange(field.name, e.target.value)} />
      )}

      {field.help && <small className="adm-field__help">{field.help}</small>}
    </label>
  );
}
