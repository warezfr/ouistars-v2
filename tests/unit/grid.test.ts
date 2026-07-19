import { describe, it, expect } from 'vitest';
import { ROUTE_RATES, HOURLY_RATES, PER_KM_RATES, HOURLY_MIN_HOURS, MEET_GREET_RATES } from '@/data/pricing';

/** Garde-fou de la grille officielle 2026-2027 : toute modification de prix
    doit apparaître comme un diff explicite dans la PR (snapshots). */
describe('cohérence de la grille officielle', () => {
  it('les ids de routes sont uniques', () => {
    const ids = ROUTE_RATES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tous les prix sont des montants positifs plausibles', () => {
    for (const r of ROUTE_RATES) {
      for (const vc of ['E', 'V', 'S'] as const) {
        expect(r.prices[vc], `${r.id}.${vc}`).toBeGreaterThan(0);
        expect(r.prices[vc], `${r.id}.${vc}`).toBeLessThan(10_000);
        expect(Number.isFinite(r.prices[vc])).toBe(true);
      }
    }
  });

  it('hiérarchie des classes : E ≤ S sur chaque route', () => {
    for (const r of ROUTE_RATES) {
      expect(r.prices.E, r.id).toBeLessThanOrEqual(r.prices.S);
    }
  });

  it('snapshot des totaux par classe (diff de PR si un prix change)', () => {
    const totals = (['E', 'V', 'S'] as const).map((vc) => ({
      class: vc,
      total: ROUTE_RATES.reduce((s, r) => s + r.prices[vc], 0),
      count: ROUTE_RATES.length,
    }));
    expect(totals).toMatchSnapshot();
  });

  it('snapshot des taux horaires / km / plancher', () => {
    expect({ HOURLY_RATES, PER_KM_RATES, HOURLY_MIN_HOURS }).toMatchSnapshot();
  });

  it('greeter : ids uniques et pax inclus cohérents', () => {
    const ids = MEET_GREET_RATES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of MEET_GREET_RATES) {
      expect(r.includedPax).toBeGreaterThan(0);
      if (r.base != null) expect(r.base).toBeGreaterThan(0);
    }
  });
});
