/**
 * Moteur tarifaire Oui Stars — calcule un prix estimé à partir de la grille 2026-2027.
 * Utilisé par le calculateur public (FareCalculator) et l'API `api/pricing/quote`.
 */
import {
  ROUTE_RATES,
  HOURLY_RATES,
  HOURLY_MIN_HOURS,
  PER_KM_RATES,
  MEET_GREET_RATES,
  VEHICLE_CLASSES,
  type VehicleClass,
  type RouteRate,
} from '@/data/pricing';

export interface FareResult {
  vehicleClass: VehicleClass;
  amount: number;
  currency: 'EUR';
  basis: 'fixed-route' | 'hourly' | 'per-km';
  routeLabel?: string;
  detail: string;
}

export interface FareInput {
  routeId?: string;
  vehicleClass: VehicleClass;
  /** Mode horaire (mise à disposition). */
  hours?: number;
  /** Mode au km (city-to-city hors grille fixe). */
  km?: number;
  passengers?: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function findRoute(routeId: string): RouteRate | undefined {
  return ROUTE_RATES.find((r) => r.id === routeId);
}

/** Calcule le tarif estimé pour un trajet. Retourne null si aucune base applicable. */
export function computeFare(input: FareInput): FareResult | null {
  const { vehicleClass, routeId, hours, km } = input;

  if (routeId) {
    const route = findRoute(routeId);
    if (route) {
      return {
        vehicleClass,
        amount: route.prices[vehicleClass],
        currency: 'EUR',
        basis: 'fixed-route',
        routeLabel: route.label,
        detail: `${route.label} — ${VEHICLE_CLASSES[vehicleClass].name}`,
      };
    }
  }

  if (hours && hours > 0) {
    const billableHours = Math.max(hours, HOURLY_MIN_HOURS);
    return {
      vehicleClass,
      amount: round(billableHours * HOURLY_RATES[vehicleClass]),
      currency: 'EUR',
      basis: 'hourly',
      detail: `${billableHours} h × ${HOURLY_RATES[vehicleClass]} €/h (min. ${HOURLY_MIN_HOURS} h)`,
    };
  }

  if (km && km > 0) {
    return {
      vehicleClass,
      amount: round(km * PER_KM_RATES[vehicleClass]),
      currency: 'EUR',
      basis: 'per-km',
      detail: `${km} km × ${PER_KM_RATES[vehicleClass]} €/km (à partir de)`,
    };
  }

  return null;
}

/** Supplément Meet & Greeter (hors véhicule/chauffeur). */
export function computeMeetGreet(airportId: string, passengers: number): number | null {
  const rate = MEET_GREET_RATES.find((r) => r.id === airportId);
  if (!rate || rate.base == null) return null;
  const extra = Math.max(0, passengers - rate.includedPax);
  const surcharge = rate.extraPaxSurcharge ?? 0;
  return rate.base + extra * surcharge;
}

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}
