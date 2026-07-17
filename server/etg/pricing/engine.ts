import type { SearchRequest, EtgOffer, RateCard, AirportMapping, CoverageZone } from '../types.js';
import {
  haversineKm,
  estimateDurationMinutes,
  resolveCoords,
  formatStartDateTimeWithTimezone,
  computeFreeCancelUntil,
  hoursUntilPickup,
  getRouteDistance,
} from './geo.js';
import {
  matchRateCards,
  buildChildSeatUpsells,
  childSeatsSupported,
  generateOfferId,
  type ChildSeatCounts,
} from './routes.js';

export interface PricingContext {
  rateCards: RateCard[];
  airports: AirportMapping[];
  zones: CoverageZone[];
}

export async function buildSearchOffers(req: SearchRequest, ctx: PricingContext): Promise<{
  start_date_time: string;
  offers: EtgOffer[];
}> {
  if (!req.start_date_time || req.passengers <= 0) {
    throw new ValidationError('start_date_time and passengers are required');
  }

  const childSeats: ChildSeatCounts = {
    children_seat_0: req.children_seat_0 ?? 0,
    children_seat_1: req.children_seat_1 ?? 0,
    children_seat_2: req.children_seat_2 ?? 0,
    children_seat_3: req.children_seat_3 ?? 0,
  };

  const startResolved = resolveCoords(req.start_point, ctx.airports, ctx.zones);
  const endResolved = resolveCoords(req.end_point, ctx.airports, ctx.zones);

  if (!startResolved || !endResolved) {
    return emptySearchResponse(req.start_date_time, 'Europe/Paris');
  }

  const timezone = startResolved.timezone;
  const formattedStart = formatStartDateTimeWithTimezone(req.start_date_time, timezone);

  if (hoursUntilPickup(req.start_date_time) < 0) {
    return { start_date_time: formattedStart, offers: [] };
  }

  const matched = matchRateCards(req.start_point, req.end_point, ctx.rateCards, ctx.airports, ctx.zones);
  
  let distance = 0;
  let duration = 0;
  const routing = await getRouteDistance(startResolved.lat, startResolved.lng, endResolved.lat, endResolved.lng);
  if (routing) {
    distance = routing.distance_meters;
    duration = routing.duration_minutes;
  } else {
    distance = Math.round(haversineKm(startResolved.lat, startResolved.lng, endResolved.lat, endResolved.lng) * 1000);
    duration = estimateDurationMinutes(distance / 1000);
  }

  const offers: EtgOffer[] = [];
  const seenCategories = new Set<string>();

  for (const card of matched) {
    const capKey = `${card.transfer_category}-${card.seats}`;
    if (seenCategories.has(capKey)) continue;

    if (req.passengers > card.seats) continue;
    if (!childSeatsSupported(childSeats, card.max_child_seats)) continue;
    if (hoursUntilPickup(req.start_date_time) < card.min_lead_time_hours) continue;

    const { upsells, extraPrice } = buildChildSeatUpsells(childSeats, card.child_seat_price, card.seats);
    const requiredSeatTypes = (['children_seat_0', 'children_seat_1', 'children_seat_2', 'children_seat_3'] as const).filter(
      t => childSeats[t] > 0,
    );
    if (requiredSeatTypes.some(t => !upsells.find(u => u.type === t))) continue;

    const totalPrice = Math.round((card.base_price + extraPrice) * 100) / 100;
    if (totalPrice <= 0) continue;

    seenCategories.add(capKey);

    offers.push({
      id: generateOfferId(),
      transfer_category: card.transfer_category,
      car_model: card.car_model,
      seats: card.seats,
      luggage_places: card.luggage_places,
      distance,
      estimated_duration_minutes: duration,
      included_waiting_time_minutes: card.included_waiting_time_minutes,
      tolls_included: card.tolls_included,
      gratuity_included: card.gratuity_included,
      free_cancel_until: computeFreeCancelUntil(req.start_date_time, card.free_cancel_hours, timezone),
      price: {
        amount: totalPrice,
        currency: card.currency,
      },
      children_seat_0: childSeats.children_seat_0,
      children_seat_1: childSeats.children_seat_1,
      children_seat_2: childSeats.children_seat_2,
      children_seat_3: childSeats.children_seat_3,
      upsells,
      rate_card_id: card.id,
    });
  }

  return { start_date_time: formattedStart, offers };
}

function emptySearchResponse(startDateTime: string, timezone: string) {
  return {
    start_date_time: formatStartDateTimeWithTimezone(startDateTime, timezone),
    offers: [] as EtgOffer[],
  };
}

export class ValidationError extends Error {
  field: string;
  constructor(message: string, field = 'request') {
    super(message);
    this.field = field;
    this.name = 'ValidationError';
  }
}

export function getOfferExpiry(pickupIso: string, minLeadHours: number): Date {
  const pickup = new Date(pickupIso.endsWith('Z') ? pickupIso : pickupIso);
  const maxTtl = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const leadDeadline = new Date(pickup.getTime() - minLeadHours * 60 * 60 * 1000);
  return maxTtl < leadDeadline ? maxTtl : leadDeadline;
}
