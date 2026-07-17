import type { RateCard } from '../types.js';
import { isInZone, resolveCoords } from './geo.js';
import type { AirportMapping, CoverageZone, GeoPoint } from '../types.js';

export function matchRateCards(
  start: GeoPoint,
  end: GeoPoint,
  rateCards: RateCard[],
  airports: AirportMapping[],
  zones: CoverageZone[],
): RateCard[] {
  const startResolved = resolveCoords(start, airports, zones);
  const endResolved = resolveCoords(end, airports, zones);
  if (!startResolved || !endResolved) return [];

  return rateCards.filter(card => {
    const startOk = matchEndpoint(card.start_type, card.start_value, startResolved, zones);
    const endOk = matchEndpoint(card.end_type, card.end_value, endResolved, zones);
    return startOk && endOk && card.active !== false;
  });
}

function matchEndpoint(
  type: string,
  value: string,
  resolved: { lat: number; lng: number; matchType: string; matchValue: string },
  zones: CoverageZone[],
): boolean {
  if (type === 'iata') {
    return resolved.matchType === 'iata' && resolved.matchValue.toUpperCase() === value.toUpperCase();
  }
  if (type === 'zone') {
    return isInZone(resolved.lat, resolved.lng, value, zones);
  }
  if (type === 'coords') {
    const [latStr, lngStr] = value.split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const dist = Math.sqrt((resolved.lat - lat) ** 2 + (resolved.lng - lng) ** 2);
    return dist < 0.05 || resolved.matchValue === value;
  }
  return false;
}

export interface ChildSeatCounts {
  children_seat_0: number;
  children_seat_1: number;
  children_seat_2: number;
  children_seat_3: number;
}

export function totalChildSeats(seats: ChildSeatCounts): number {
  return seats.children_seat_0 + seats.children_seat_1 + seats.children_seat_2 + seats.children_seat_3;
}

export function childSeatsSupported(seats: ChildSeatCounts, maxSeats: number): boolean {
  return totalChildSeats(seats) <= maxSeats;
}

export function buildChildSeatUpsells(
  seats: ChildSeatCounts,
  seatPrice: number,
  offerSeats: number,
): { upsells: import('../types.js').Upsell[]; extraPrice: number } {
  const upsells: import('../types.js').Upsell[] = [];
  let extraPrice = 0;
  const types = ['children_seat_0', 'children_seat_1', 'children_seat_2', 'children_seat_3'] as const;

  for (const type of types) {
    const count = seats[type];
    if (count > 0) {
      upsells.push({
        id: `seat-${type}`,
        type,
        price: seatPrice,
        count,
        max_count: Math.min(count + 1, Math.max(1, offerSeats - 1)),
      });
      extraPrice += seatPrice * count;
    }
  }

  return { upsells, extraPrice };
}

export function generateOfferId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'OS';
  for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'OS-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id.slice(0, 15);
}
