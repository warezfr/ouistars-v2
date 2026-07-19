// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

/**
 * livePricing (front) — faille n° 2 de l'audit : la synchro remplace la grille
 * EN PLACE (splice/mutation) ; tout composant abonné via usePricingSync doit
 * voir les nouveaux prix, et les modules qui lisent ROUTE_RATES après coup
 * doivent lire les prix mis à jour.
 */
const state = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/supabase', () => ({ get supabase() { return state.client; } }));

function fakeDb(routes: unknown[], rates?: Record<string, number>) {
  return {
    from: (table: string) => ({
      select: () => {
        if (table === 'cms_singletons') {
          return { eq: () => ({ maybeSingle: () => Promise.resolve({ data: rates ? { data: rates } : null, error: null }) }) };
        }
        return {
          eq: () => ({
            eq: () => ({
              order: () => Promise.resolve({
                data: routes.length ? routes : [],
                error: null,
              }),
            }),
          }),
        };
      },
    }),
  };
}

beforeEach(() => { vi.resetModules(); state.client = null; });

describe('initLivePricing + usePricingSync', () => {
  it('remplace ROUTE_RATES en place et notifie les abonnés', async () => {
    state.client = fakeDb([
      { data: { routeId: 'paris-versailles', label: 'Paris ⇄ Versailles', category: 'tour', priceE: 115, priceV: 125, priceS: 195 }, position: 1 },
    ], { hourlyE: 85 });

    const pricing = await import('@/data/pricing');
    const { initLivePricing, usePricingSync } = await import('@/lib/livePricing');

    const before = pricing.ROUTE_RATES.length;
    expect(before).toBeGreaterThan(1);

    const { result } = renderHook(() => usePricingSync());
    const v0 = result.current;

    await initLivePricing();

    // Notification du store externe → version incrémentée dans le hook.
    await waitFor(() => expect(result.current).toBe(v0 + 1));

    // Mutation en place : la même référence de tableau porte la nouvelle grille.
    expect(pricing.ROUTE_RATES).toHaveLength(1);
    expect(pricing.ROUTE_RATES[0].prices).toEqual({ E: 115, V: 125, S: 195 });
    expect(pricing.HOURLY_RATES.E).toBe(85);
  });

  it('entrées invalides ignorées ; zéro entrée valide → grille intacte', async () => {
    state.client = fakeDb([
      { data: { routeId: 'x', label: 'Sans prix' }, position: 1 },
    ]);
    const pricing = await import('@/data/pricing');
    const { initLivePricing } = await import('@/lib/livePricing');
    const before = [...pricing.ROUTE_RATES.map((r) => r.id)];
    await initLivePricing();
    expect(pricing.ROUTE_RATES.map((r) => r.id)).toEqual(before);
  });

  it('sans Supabase → aucun changement, pas de crash', async () => {
    state.client = null;
    const pricing = await import('@/data/pricing');
    const { initLivePricing } = await import('@/lib/livePricing');
    const before = pricing.ROUTE_RATES.length;
    await initLivePricing();
    expect(pricing.ROUTE_RATES).toHaveLength(before);
  });

  it('erreur réseau pendant la synchro → repli statique silencieux', async () => {
    state.client = {
      from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ order: () => Promise.reject(new Error('HS')) }), maybeSingle: () => Promise.reject(new Error('HS')) }) }) }),
    };
    const pricing = await import('@/data/pricing');
    const { initLivePricing } = await import('@/lib/livePricing');
    const before = pricing.ROUTE_RATES.length;
    await expect(initLivePricing()).resolves.toBeUndefined();
    expect(pricing.ROUTE_RATES).toHaveLength(before);
  });
});
