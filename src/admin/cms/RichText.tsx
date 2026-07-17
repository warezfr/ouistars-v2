import { useEffect, useRef } from 'react';

/**
 * Éditeur de texte riche minimal (sans dépendance) basé sur contentEditable.
 * Produit du HTML. Barre d'outils : gras, italique, souligné, titres, listes, lien.
 */
const BTNS: { cmd: string; arg?: string; label: string; title: string }[] = [
  { cmd: 'bold', label: 'B', title: 'Gras' },
  { cmd: 'italic', label: 'I', title: 'Italique' },
  { cmd: 'underline', label: 'U', title: 'Souligné' },
  { cmd: 'formatBlock', arg: 'H2', label: 'H2', title: 'Titre 2' },
  { cmd: 'formatBlock', arg: 'H3', label: 'H3', title: 'Titre 3' },
  { cmd: 'formatBlock', arg: 'P', label: '¶', title: 'Paragraphe' },
  { cmd: 'insertUnorderedList', label: '• Liste', title: 'Liste à puces' },
  { cmd: 'insertOrderedList', label: '1. Liste', title: 'Liste numérotée' },
];

interface Props {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export default function RichText({ value, onChange, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Synchronise le contenu externe → éditeur (sans casser le curseur pendant la frappe).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value ?? '')) {
      ref.current.innerHTML = value ?? '';
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    if (disabled) return;
    ref.current?.focus();
    // eslint-disable-next-line deprecation/deprecation
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? '');
  };

  const addLink = () => {
    if (disabled) return;
    const url = prompt('URL du lien :', 'https://');
    if (url) exec('createLink', url);
  };

  return (
    <div className={`adm-rt${disabled ? ' is-disabled' : ''}`}>
      <div className="adm-rt__bar">
        {BTNS.map((b) => (
          <button key={b.label} type="button" title={b.title} className="adm-rt__btn"
            onMouseDown={(e) => { e.preventDefault(); exec(b.cmd, b.arg); }}>
            {b.label}
          </button>
        ))}
        <button type="button" title="Lien" className="adm-rt__btn"
          onMouseDown={(e) => { e.preventDefault(); addLink(); }}>🔗</button>
      </div>
      <div
        ref={ref}
        className="adm-rt__area"
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}
