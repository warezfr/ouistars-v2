import { describe, it, expect } from 'vitest';
import { computeFare, computeMeetGreet, findRoute, formatEUR } from '@/lib/pricing';
import {
  ROUTE_RATES, HOURLY_RATES, HOURLY_MIN_HOURS, PER_KM_RATES, MEET_GREET_RATES,
} from '@/data/pricing';

describe('computeFare — route fixe', () => {
  it('retourne le prix grille pour chaque classe', () => {
    const route = ROUTE_RATES[0];
    for (const vc of ['E', 'V', 'S'] as const) {
      const fare = computeFare({ routeId: route.id, vehicleClass: vc });
      expect(fare).not.toBeNull();
      expect(fare!.basis).toBe('fixed-route');
      expect(fare!.amount).toBe(route.prices[vc]);
      expect(fare!.routeLabel).toBe(route.label);
      expect(fare!.currency).toBe('EUR');
    }
  });

  it('route inconnue sans autre base → null', () => {
    expect(computeFare({ routeId: 'route-fantome', vehicleClass: 'E' })).toBeNull();
  });

  it('route inconnue mais heures fournies → bascule en horaire', () => {
    const fare = computeFare({ routeId: 'route-fantome', vehicleClass: 'E', hours: 4 });
    expect(fare?.basis).toBe('hourly');
  });
});

describe('computeFare — horaire', () => {
  it('applique le plancher de 3 h (1 h demandée → 3 h facturées)', () => {
    const fare = computeFare({ vehicleClass: 'E', hours: 1 });
    expect(fare!.amount).toBe(HOURLY_MIN_HOURS * HOURLY_RATES.E);
  });

  it('facture les heures réelles au-delà du plancher', () => {
    const fare = computeFare({ vehicleClass: 'S', hours: 5 });
    expect(fare!.amount).toBe(5 * HOURLY_RATES.S);
  });

  it('hours: 0 n’active pas le mode horaire', () => {
    expect(computeFare({ vehicleClass: 'E', hours: 0 })).toBeNull();
  });
});

describe('computeFare — au kilomètre', () => {
  it('multiplie km × taux de la classe', () => {
    const fare = computeFare({ vehicleClass: 'V', km: 100 });
    expect(fare!.basis).toBe('per-km');
    expect(fare!.amount).toBe(100 * PER_KM_RATES.V);
  });

  it('arrondit à 2 décimales', () => {
    const fare = computeFare({ vehicleClass: 'E', km: 33.333 });
    expect(fare!.amount).toBe(Math.round(33.333 * PER_KM_RATES.E * 100) / 100);
  });

  it('la route fixe prime sur le km quand les deux sont fournis', () => {
    const route = ROUTE_RATES[0];
    const fare = computeFare({ routeId: route.id, vehicleClass: 'E', km: 500 });
    expect(fare!.basis).toBe('fixed-route');
  });
});

describe('computeMeetGreet', () => {
  it('tarif de base pour pax inclus', () => {
    const rate = MEET_GREET_RATES.find((r) => r.base != null)!;
    expect(computeMeetGreet(rate.id, rate.includedPax)).toBe(rate.base);
  });

  it('supplément par pax au-delà des inclus', () => {
    const rate = MEET_GREET_RATES.find((r) => r.base != null && r.extraPaxSurcharge != null)!;
    const total = computeMeetGreet(rate.id, rate.includedPax + 2);
    expect(total).toBe(rate.base! + 2 * rate.extraPaxSurcharge!);
  });

  it('aéroport « sur devis » (base null) → null', () => {
    const surDevis = MEET_GREET_RATES.find((r) => r.base == null);
    if (surDevis) expect(computeMeetGreet(surDevis.id, 2)).toBeNull();
  });

  it('aéroport inconnu → null', () => {
    expect(computeMeetGreet('aeroport-fantome', 2)).toBeNull();
  });
});

describe('findRoute / formatEUR', () => {
  it('findRoute retrouve chaque id de la grille', () => {
    for (const r of ROUTE_RATES) expect(findRoute(r.id)?.label).toBe(r.label);
  });

  it('formatEUR formate en euros français sans décimales', () => {
    const s = formatEUR(1620);
    expect(s).toContain('€');
    expect(s.replace(/ | | /g, '')).toBe('1620€');
  });
});
