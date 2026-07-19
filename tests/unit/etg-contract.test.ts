import { describe, it, expect } from 'vitest';
import { memoryStore } from '../../server/etg/store/memory';
import { ROUTE_RATES } from '@/data/pricing';

/**
 * Test de contrat entre les deux moteurs tarifaires (faille n° 3 de l'audit) :
 * les fiches ETG de repli (store mémoire, utilisées quand Supabase est absent)
 * doivent porter les mêmes montants que la grille officielle publique.
 * Correspondance des catégories : business = E, business_van = V, first = S.
 */
const MAPPING: Record<string, { routeId: string; cls: 'E' | 'V' | 'S' }> = {
  'cdg-paris-business': { routeId: 'cdg-ory-lbg-paris', cls: 'E' },
  'cdg-paris-business-van': { routeId: 'cdg-ory-lbg-paris', cls: 'V' },
  'cdg-paris-first': { routeId: 'cdg-ory-lbg-paris', cls: 'S' },
  'ory-paris-business': { routeId: 'cdg-ory-lbg-paris', cls: 'E' },
  'ory-paris-business-van': { routeId: 'cdg-ory-lbg-paris', cls: 'V' },
  'ory-paris-first': { routeId: 'cdg-ory-lbg-paris', cls: 'S' },
  'lbg-paris-business': { routeId: 'cdg-ory-lbg-paris', cls: 'E' },
  'paris-cdg-business': { routeId: 'cdg-ory-lbg-paris', cls: 'E' },
  'paris-cdg-business-van': { routeId: 'cdg-ory-lbg-paris', cls: 'V' },
  'paris-ory-business': { routeId: 'cdg-ory-lbg-paris', cls: 'E' },
  'gare-nord-paris-business': { routeId: 'paris-stations', cls: 'E' },
  'paris-versailles-business': { routeId: 'paris-versailles', cls: 'E' },
  'nce-monaco-business': { routeId: 'nce-monaco', cls: 'E' },
  'nce-monaco-business-van': { routeId: 'nce-monaco', cls: 'V' },
  'monaco-nce-business': { routeId: 'nce-monaco', cls: 'E' },
};

describe('contrat grille publique ⇄ fiches ETG de repli', () => {
  const cards = memoryStore.getRateCards();

  it('chaque fiche mappée porte le prix officiel de la grille', () => {
    for (const [routeKey, { routeId, cls }] of Object.entries(MAPPING)) {
      const card = cards.find((c) => c.route_key === routeKey);
      expect(card, `fiche ${routeKey} absente du store`).toBeDefined();
      const route = ROUTE_RATES.find((r) => r.id === routeId)!;
      expect(card!.base_price, `${routeKey} ≠ grille ${routeId}.${cls}`).toBe(route.prices[cls]);
      expect(card!.currency).toBe('EUR');
    }
  });

  it('les fiches hors grille restent plausibles (bornes)', () => {
    for (const c of cards) {
      expect(c.base_price, c.route_key).toBeGreaterThan(0);
      expect(c.base_price, c.route_key).toBeLessThan(5000);
    }
  });

  it('capacités cohérentes avec les classes de véhicules', () => {
    for (const c of cards) {
      if (c.transfer_category === 'business') expect(c.seats).toBeLessThanOrEqual(3);
      if (c.transfer_category === 'business_van') expect(c.seats).toBe(7);
      if (c.transfer_category === 'first') expect(c.seats).toBeLessThanOrEqual(3);
    }
  });
});
