// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

/** usePublished / useSingleton — repli statique, contenu publié, fusion. */

const state = vi.hoisted(() => ({
  client: null as unknown,
}));
vi.mock('@/lib/supabase', () => ({
  get supabase() { return state.client; },
}));

function fakeCms(opts: { entries?: unknown[]; entriesError?: boolean; singleton?: unknown }) {
  return {
    from: (table: string) => ({
      select: () => {
        if (table === 'cms_singletons') {
          return {
            eq: () => ({
              maybeSingle: () => Promise.resolve(
                opts.singleton !== undefined
                  ? { data: { data: opts.singleton }, error: null }
                  : { data: null, error: null },
              ),
            }),
          };
        }
        return {
          eq: () => ({
            eq: () => ({
              order: () => Promise.resolve(
                opts.entriesError
                  ? { data: null, error: { message: 'boom' } }
                  : { data: opts.entries ?? [], error: null },
              ),
            }),
          }),
        };
      },
    }),
  };
}

beforeEach(() => { state.client = null; vi.resetModules(); });

const FALLBACK = [{ name: 'statique-1' }, { name: 'statique-2' }];

describe('usePublished', () => {
  it('Supabase non configuré → repli statique', async () => {
    const { usePublished } = await import('@/lib/cms');
    const { result } = renderHook(() => usePublished('service', FALLBACK));
    await waitFor(() => expect(result.current).toEqual(FALLBACK));
  });

  it('erreur de requête → repli statique silencieux', async () => {
    state.client = fakeCms({ entriesError: true });
    const { usePublished } = await import('@/lib/cms');
    const { result } = renderHook(() => usePublished('service', FALLBACK));
    await waitFor(() => expect(result.current).toEqual(FALLBACK));
  });

  it('collection vide → repli statique', async () => {
    state.client = fakeCms({ entries: [] });
    const { usePublished } = await import('@/lib/cms');
    const { result } = renderHook(() => usePublished('service', FALLBACK));
    await waitFor(() => expect(result.current).toEqual(FALLBACK));
  });

  it('contenu publié → remplace le statique', async () => {
    state.client = fakeCms({ entries: [{ data: { name: 'cms-1' }, position: 1 }] });
    const { usePublished } = await import('@/lib/cms');
    const { result } = renderHook(() => usePublished('service', FALLBACK));
    await waitFor(() => expect(result.current).toEqual([{ name: 'cms-1' }]));
  });
});

describe('useSingleton', () => {
  it('fusionne le contenu CMS par-dessus le fallback (clés absentes conservées)', async () => {
    state.client = fakeCms({ singleton: { email: 'cms@ouistars.com' } });
    const { useSingleton } = await import('@/lib/cms');
    const { result } = renderHook(() => useSingleton('settings', { email: 'x@y.fr', phone: '+336' }));
    await waitFor(() => expect(result.current).toEqual({ email: 'cms@ouistars.com', phone: '+336' }));
  });

  it('singleton absent → fallback intact', async () => {
    state.client = fakeCms({});
    const { useSingleton } = await import('@/lib/cms');
    const { result } = renderHook(() => useSingleton('settings', { email: 'x@y.fr' }));
    await waitFor(() => expect(result.current).toEqual({ email: 'x@y.fr' }));
  });
});
