import type { BookRequest, StoredOrder } from '../types.js';
import { ValidationError } from '../pricing/engine.js';
import { loadOffer, persistOrder } from '../repository.js';
import { getAdminBaseUrl } from '../auth.js';
import { generateOrderId } from '../pricing/routes.js';
import { notifyNewEtgOrder } from '../notify.js';
import { getPricingContext } from '../repository.js';

export async function handleBook(body: BookRequest) {
  if (!body.offer_id) throw new ValidationError('offer_id is required', 'offer_id');
  if (!body.main_passenger?.first_name || !body.main_passenger?.last_name || !body.main_passenger?.phone_number) {
    throw new ValidationError('main_passenger fields are required');
  }

  const stored = await loadOffer(body.offer_id);
  if (!stored) throw new ValidationError('offer not found or expired', 'offer_id');

  const { offer, search } = stored;
  const ctx = await getPricingContext();
  const card = ctx.rateCards.find(c => c.id === offer.rate_card_id);

  const orderId = generateOrderId();
  const supplierLink = `${getAdminBaseUrl()}/orders/${orderId}`;

  const isAirportPickup = body.start_point?.type === 'iata';
  const flightNumber = body.flight_number ?? 'No flight';
  let bufferTime = 0;
  if (isAirportPickup && flightNumber !== 'No flight') {
    const airport = ctx.airports.find(a => a.iata_code === body.start_point.iata?.toUpperCase());
    bufferTime = airport?.buffer_time_minutes ?? 45;
  }

  const bookedUpsells = (body.upsells ?? []).length
    ? offer.upsells
        .filter(u => body.upsells!.some(bu => bu.id === u.id))
        .map(u => {
          const requested = body.upsells!.find(bu => bu.id === u.id)!;
          return { ...u, count: requested.count };
        })
    : [];

  const order: StoredOrder = {
    order_id: orderId,
    offer_id: offer.id,
    status: 'confirmed',
    etg_status: 'confirmed',
    price_amount: offer.price.amount,
    price_currency: offer.price.currency,
    start_time: search.start_date_time,
    passengers: body.passengers,
    luggage_places: body.luggage_places,
    sport_luggage_places: body.sport_luggage_places ?? 0,
    animals: body.animals_places ?? 0,
    wheelchairs_places: body.wheelchairs_places ?? 0,
    children_seat_0: body.children_seat_0 ?? offer.children_seat_0,
    children_seat_1: body.children_seat_1 ?? offer.children_seat_1,
    children_seat_2: body.children_seat_2 ?? offer.children_seat_2,
    children_seat_3: body.children_seat_3 ?? offer.children_seat_3,
    transfer_category: offer.transfer_category,
    distance: offer.distance,
    estimated_duration_minutes: offer.estimated_duration_minutes,
    included_waiting_time_minutes: offer.included_waiting_time_minutes,
    free_cancel_until: offer.free_cancel_until,
    flight_number: flightNumber,
    shield_text: body.shield_text ?? null,
    comment: body.comment ?? null,
    main_passenger: body.main_passenger,
    book_payload: body,
    search_payload: search,
    upsells: bookedUpsells,
    driver_info: null,
    car_info: null,
    meeting_info: null,
    meeting_instructions: isAirportPickup
      ? 'Meeting point is at arrival hall after exit of baggage claim and customs.'
      : null,
    meeting_images: null,
    buffer_time_minutes: bufferTime,
    penalty_amount: null,
    supplier_link: supplierLink,
    workflow_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await persistOrder(order);

  await notifyNewEtgOrder({
    order_id: orderId,
    passengers: body.passengers,
    start_time: search.start_date_time,
    price_amount: offer.price.amount,
    price_currency: offer.price.currency,
    main_passenger: body.main_passenger,
    supplier_link: supplierLink,
  });

  const response: Record<string, unknown> = {
    order_id: orderId,
    supplier_link: supplierLink,
    start_time: search.start_date_time,
    distance: offer.distance,
    estimated_duration_minutes: offer.estimated_duration_minutes,
    included_waiting_time_minutes: offer.included_waiting_time_minutes,
    passengers: body.passengers,
    luggage_places: body.luggage_places,
    price: offer.price,
    buffer_time_minutes: bufferTime,
    meeting_instructions: order.meeting_instructions,
  };

  if (order.children_seat_0) response.children_seat_0 = order.children_seat_0;
  if (order.children_seat_1) response.children_seat_1 = order.children_seat_1;
  if (order.children_seat_2) response.children_seat_2 = order.children_seat_2;
  if (order.children_seat_3) response.children_seat_3 = order.children_seat_3;
  if (body.sport_luggage_places) response.sport_luggage_places = body.sport_luggage_places;
  if (body.animals_places) response.animals = body.animals_places;
  if (body.wheelchairs_places) response.wheelchairs_places = body.wheelchairs_places;
  if (bookedUpsells.length) response.upsells = bookedUpsells;
  if (body.flight_number) response.flight_number = body.flight_number;
  if (body.comment) response.comment = body.comment;
  if (body.shield_text) response.shield_text = body.shield_text;

  return response;
}

import { BookRequestSchema } from '../schemas.js';

export function parseBookBody(body: unknown): BookRequest {
  const result = BookRequestSchema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ValidationError(first.message, String(first.path[0] ?? 'request'));
  }
  return result.data as BookRequest;
}
