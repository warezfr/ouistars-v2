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
  const label = <label htmlFor={field.name} className="form-label">{field.label}{field.required && ' *'}</label>;

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

      {field.type === 'number' && (
        <input id={field.name} type="number" className="form-control" disabled={disabled}
          placeholder={field.placeholder}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(field.name, e.target.value === '' ? null : Number(e.target.value))} />
      )}

      {field.type === 'text' && (
        <input id={field.name} type="text" className="form-control" disabled={disabled}
          placeholder={field.placeholder} value={(value as string) ?? ''}
          onChange={(e) => onChange(field.name, e.target.value)} />
      )}

      {field.help && <small className="text-muted d-block mt-1">{field.help}</small>}
    </div>
  );
}
