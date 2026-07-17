/**
 * Estimateur de trajet — relie le formulaire de réservation à la grille 2026-2027.
 * One Way : trajet fixe si connu (ZONE_ROUTE_MAP), sinon estimation au km (haversine × €/km).
 * Hourly : durée × tarif horaire (min. 3 h).
 */
import { LOCATIONS, ZONE_ROUTE_MAP, type Poi } from '@/data/locations';
import {
  ROUTE_RATES,
  PER_KM_RATES,
  HOURLY_RATES,
  HOURLY_MIN_HOURS,
  type VehicleClass,
} from '@/data/pricing';

export type Prices = Record<VehicleClass, number>;

export interface OneWayEstimate {
  basis: 'fixed-route' | 'per-km';
  distanceKm: number;
  prices: Prices;
  routeLabel?: string;
}

export function findPoi(id: string): Poi | undefined {
  return LOCATIONS.find((p) => p.id === id);
}

/** Recherche accent-insensible pour l'autocomplétion. */
export function searchLocations(query: string, limit = 6): Poi[] {
  const q = normalize(query);
  if (!q) return LOCATIONS.filter((p) => p.type === 'airport' || p.type === 'station').slice(0, limit);
  const scored = LOCATIONS
    .map((p) => ({ p, score: matchScore(normalize(`${p.label} ${p.sub}`), q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.p);
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function matchScore(hay: string, needle: string): number {
  if (hay.startsWith(needle)) return 3;
  if (hay.includes(` ${needle}`)) return 2;
  if (hay.includes(needle)) return 1;
  return 0;
}

const R = 6371; // km
export function haversineKm(a: Poi, b: Poi): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const toRad = (d: number) => (d * Math.PI) / 180;

/** Distance routière estimée ≈ distance à vol d'oiseau × 1.3 (facteur détour). */
function roadKm(a: Poi, b: Poi): number {
  return Math.round(haversineKm(a, b) * 1.3);
}

function fixedRouteId(a: Poi, b: Poi): string | undefined {
  return ZONE_ROUTE_MAP[`${a.zone}|${b.zone}`] ?? ZONE_ROUTE_MAP[`${b.zone}|${a.zone}`];
}

export function estimateOneWay(from: Poi, to: Poi): OneWayEstimate {
  const rid = fixedRouteId(from, to);
  if (rid) {
    const route = ROUTE_RATES.find((r) => r.id === rid);
    if (route) {
      return {
        basis: 'fixed-route',
        distanceKm: roadKm(from, to),
        prices: { ...route.prices },
        routeLabel: route.label,
      };
    }
  }
  // Estimation au kilomètre (city-to-city hors grille). Plancher = tarif ville.
  const km = Math.max(roadKm(from, to), 5);
  const price = (rate: number) => Math.max(100, Math.round((km * rate) / 5) * 5);
  return {
    basis: 'per-km',
    distanceKm: km,
    prices: { E: price(PER_KM_RATES.E), V: price(PER_KM_RATES.V), S: price(PER_KM_RATES.S) },
  };
}

export function estimateHourly(hours: number): { hours: number; prices: Prices } {
  const h = Math.max(hours || HOURLY_MIN_HOURS, HOURLY_MIN_HOURS);
  return { hours: h, prices: { E: h * HOURLY_RATES.E, V: h * HOURLY_RATES.V, S: h * HOURLY_RATES.S } };
}
