import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Lecture du contenu publié depuis le CMS (Supabase), avec repli statique.
 * - Si Supabase n'est pas configuré → renvoie le fallback (design inchangé).
 * - Si la collection est vide ou en erreur → renvoie le fallback.
 * - Sinon → renvoie les objets `data` publiés, triés par `position`.
 */
export function usePublished<T>(collection: string, fallback: T[]): T[] {
  const [items, setItems] = useState<T[]>(fallback);

  useEffect(() => {
    if (!supabase) { setItems(fallback); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase!
        .from('cms_entries')
        .select('data, position')
        .eq('collection', collection)
        .eq('status', 'published')
        .order('position', { ascending: true });
      if (cancelled) return;
      if (error || !data || data.length === 0) { setItems(fallback); return; }
      setItems(data.map((r) => r.data as T));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);

  return items;
}

/** Variante « singleton » : renvoie l'objet `data` ou le fallback. */
export function useSingleton<T extends Record<string, unknown>>(key: string, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    if (!supabase) { setValue(fallback); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase!.from('cms_singletons').select('data').eq('key', key).maybeSingle();
      if (cancelled) return;
      if (error || !data?.data) { setValue(fallback); return; }
      setValue({ ...fallback, ...(data.data as T) });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return value;
}
