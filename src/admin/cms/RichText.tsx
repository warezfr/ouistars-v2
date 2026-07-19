import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Éditeur de texte riche élaboré (sans dépendance) basé sur contentEditable.
 * Produit du HTML. Outils : styles, titres, listes, alignements, citation,
 * lien, image téléversée (Supabase Storage), séparateur, annuler/rétablir,
 * nettoyage de format et vue HTML.
 */
interface Btn { cmd?: string; arg?: string; icon: string; title: string; custom?: 'link' | 'image' | 'html' }
const GROUPS: Btn[][] = [
  [
    { cmd: 'undo', icon: 'bi-arrow-counterclockwise', title: 'Annuler' },
    { cmd: 'redo', icon: 'bi-arrow-clockwise', title: 'Rétablir' },
  ],
  [
    { cmd: 'formatBlock', arg: 'H2', icon: 'bi-type-h2', title: 'Titre 2' },
    { cmd: 'formatBlock', arg: 'H3', icon: 'bi-type-h3', title: 'Titre 3' },
    { cmd: 'formatBlock', arg: 'P', icon: 'bi-paragraph', title: 'Paragraphe' },
  ],
  [
    { cmd: 'bold', icon: 'bi-type-bold', title: 'Gras' },
    { cmd: 'italic', icon: 'bi-type-italic', title: 'Italique' },
    { cmd: 'underline', icon: 'bi-type-underline', title: 'Souligné' },
    { cmd: 'strikeThrough', icon: 'bi-type-strikethrough', title: 'Barré' },
  ],
  [
    { cmd: 'insertUnorderedList', icon: 'bi-list-ul', title: 'Liste à puces' },
    { cmd: 'insertOrderedList', icon: 'bi-list-ol', title: 'Liste numérotée' },
    { cmd: 'formatBlock', arg: 'BLOCKQUOTE', icon: 'bi-quote', title: 'Citation' },
    { cmd: 'insertHorizontalRule', icon: 'bi-hr', title: 'Séparateur' },
  ],
  [
    { cmd: 'justifyLeft', icon: 'bi-text-left', title: 'Aligner à gauche' },
    { cmd: 'justifyCenter', icon: 'bi-text-center', title: 'Centrer' },
    { cmd: 'justifyRight', icon: 'bi-text-right', title: 'Aligner à droite' },
  ],
  [
    { custom: 'link', icon: 'bi-link-45deg', title: 'Insérer un lien' },
    { custom: 'image', icon: 'bi-image', title: 'Insérer une image (téléversement)' },
  ],
  [
    { cmd: 'removeFormat', icon: 'bi-eraser', title: 'Effacer le format' },
    { custom: 'html', icon: 'bi-code-slash', title: 'Vue HTML' },
  ],
];

interface Props {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export default function RichText({ value, onChange, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [htmlView, setHtmlView] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!htmlView && ref.current && ref.current.innerHTML !== (value ?? '')) {
      ref.current.innerHTML = value ?? '';
    }
  }, [value, htmlView]);

  const emit = () => onChange(ref.current?.innerHTML ?? '');

  const exec = (cmd: string, arg?: string) => {
    if (disabled) return;
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const onCustom = (kind: 'link' | 'image' | 'html') => {
    if (kind === 'link') {
      const url = prompt('URL du lien :', 'https://');
      if (url) exec('createLink', url);
    } else if (kind === 'image') {
      fileRef.current?.click();
    } else {
      setHtmlView((v) => !v);
    }
  };

  async function uploadInline(file: File) {
    if (!supabase) { alert('Supabase non configuré.'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const rand = Math.abs([...file.name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
      const path = `rt-${Date.now().toString(36)}-${rand.toString(36)}.${ext}`;
      const { error } = await supabase.storage.from('cms').upload(path, file, {
        cacheControl: '31536000', contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('cms').getPublicUrl(path);
      exec('insertImage', data.publicUrl);
    } catch (e) {
      alert('Téléversement impossible : ' + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`adm-rt${disabled ? ' is-disabled' : ''}`}>
      <div className="adm-rt__bar">
        {GROUPS.map((group, gi) => (
          <span className="adm-rt__group" key={gi}>
            {group.map((b) => (
              <button key={b.icon} type="button" title={b.title}
                className={`adm-rt__btn${b.custom === 'html' && htmlView ? ' is-on' : ''}`}
                disabled={disabled || (b.custom === 'image' && uploading)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (b.custom) onCustom(b.custom);
                  else exec(b.cmd!, b.arg);
                }}>
                <i className={`bi ${b.custom === 'image' && uploading ? 'bi-hourglass-split' : b.icon}`} />
              </button>
            ))}
          </span>
        ))}
      </div>

      {htmlView ? (
        <textarea
          className="adm-rt__html"
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <div
          ref={ref}
          className="adm-rt__area"
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
        />
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadInline(f); e.target.value = ''; }} />
    </div>
  );
}
