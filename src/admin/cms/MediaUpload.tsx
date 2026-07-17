import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Champ image : saisie d'URL OU téléversement vers Supabase Storage (bucket « cms »).
 * Le bucket est public en lecture ; l'écriture exige un admin authentifié (RLS storage).
 */
interface Props {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MediaUpload({ value, onChange, disabled, placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    if (!supabase) { setError('Supabase non configuré.'); return; }
    setBusy(true); setError(null);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const rand = Math.abs([...file.name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
      const path = `${Date.now().toString(36)}-${rand.toString(36)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('cms').upload(path, file, {
        cacheControl: '31536000', upsert: false, contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('cms').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-media">
      <div className="adm-media__row">
        <input
          type="text" className="adm-media__url" placeholder={placeholder ?? '/image.webp ou https://…'}
          value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="adm-media__btn" disabled={disabled || busy}
          onClick={() => fileRef.current?.click()}>
          {busy ? '…' : 'Téléverser'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      </div>
      {error && <small className="adm-media__err">{error}</small>}
      {value && <img className="adm-field__thumb" src={value} alt="" loading="lazy" />}
    </div>
  );
}
