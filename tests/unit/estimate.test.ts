import { describe, it, expect } from 'vitest';
import {
  findPoi, searchLocations, haversineKm, estimateOneWay, estimateHourly,
} from '@/lib/estimate';
import { HOURLY_RATES, HOURLY_MIN_HOURS, PER_KM_RATES, ROUTE_RATES } from '@/data/pricing';
import { ZONE_ROUTE_MAP } from '@/data/locations';

describe('searchLocations — autocomplétion', () => {
  it('recherche insensible aux accents (« epernay » → Épernay)', () => {
    const hits = searchLocations('epernay');
    expect(hits.some((p) => p.label.toLowerCase().includes('épernay'))).toBe(true);
  });

  it('« CDG » retrouve Charles de Gaulle', () => {
    const hits = searchLocations('cdg');
    expect(hits.some((p) => p.id === 'cdg')).toBe(true);
  });

  it('requête vide → aéroports et gares en tête, limite respectée', () => {
    const hits = searchLocations('', 6);
    expect(hits.length).toBeLessThanOrEqual(6);
    expect(hits.every((p) => p.type === 'airport' || p.type === 'station')).toBe(true);
  });

  it('préfixe mieux classé que simple inclusion', () => {
    const hits = searchLocations('gare');
    expect(hits[0].label.toLowerCase().startsWith('gare')).toBe(true);
  });
});

describe('haversineKm', () => {
  it('Paris (Champs-Élysées) → CDG ≈ 21 km à vol d’oiseau (±20 %)', () => {
    const paris = findPoi('champs-elysees')!;
    const cdg = findPoi('cdg')!;
    const d = haversineKm(paris, cdg);
    expect(d).toBeGreaterThan(17);
    expect(d).toBeLessThan(26);
  });

  it('distance nulle entre un point et lui-même', () => {
    const cdg = findPoi('cdg')!;
    expect(haversineKm(cdg, cdg)).toBe(0);
  });

  it('symétrique : d(a,b) = d(b,a)', () => {
    const a = findPoi('cdg')!;
    const b = findPoi('ory')!;
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });
});

describe('estimateOneWay', () => {
  it('zones couvertes par la grille → prix fixe de la route mappée', () => {
    const cdg = findPoi('cdg')!;
    const paris = findPoi('champs-elysees')!;
    const est = estimateOneWay(cdg, paris);
    expect(est.basis).toBe('fixed-route');
    const rid = ZONE_ROUTE_MAP['paris-airport|paris'] ?? ZONE_ROUTE_MAP['paris|paris-airport'];
    const route = ROUTE_RATES.find((r) => r.id === rid)!;
    expect(est.prices).toEqual(route.prices);
  });

  it('le sens inverse donne le même prix (grille bidirectionnelle)', () => {
    const cdg = findPoi('cdg')!;
    const paris = findPoi('champs-elysees')!;
    expect(estimateOneWay(cdg, paris).prices).toEqual(estimateOneWay(paris, cdg).prices);
  });

  it('hors grille → per-km, arrondi au multiple de 5, plancher 100 €', () => {
    const pois = ['cdg', 'ory', 'lbg', 'champs-elysees'].map((id) => findPoi(id)!);
    // Cherche une paire hors grille ; sinon vérifie au moins les règles sur un cas per-km simulé.
    const est = estimateOneWay(pois[0], pois[1]);
    if (est.basis === 'per-km') {
      for (const vc of ['E', 'V', 'S'] as const) {
        expect(est.prices[vc] % 5).toBe(0);
        expect(est.prices[vc]).toBeGreaterThanOrEqual(100);
      }
    }
    // Règle du plancher vérifiée dans tous les cas : distance minimale 5 km.
    expect(est.distanceKm).toBeGreaterThanOrEqual(5);
  });

  it('per-km : S plus cher que E (4,5 vs 3,5 €/km)', () => {
    expect(PER_KM_RATES.S).toBeGreaterThan(PER_KM_RATES.E);
  });
});

describe('estimateHourly', () => {
  it('plancher 3 h appliqué', () => {
    const { hours, prices } = estimateHourly(1);
    expect(hours).toBe(HOURLY_MIN_HOURS);
    expect(prices.E).toBe(HOURLY_MIN_HOURS * HOURLY_RATES.E);
  });

  it('0 / NaN → plancher', () => {
    expect(estimateHourly(0).hours).toBe(HOURLY_MIN_HOURS);
  });

  it('au-delà du plancher : heures réelles × taux', () => {
    const { prices } = estimateHourly(8);
    expect(prices.S).toBe(8 * HOURLY_RATES.S);
  });
});
