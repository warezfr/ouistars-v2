import { loadOrder } from '../repository.js';
import { ValidationError } from '../pricing/engine.js';

import { StatusRequestSchema } from '../schemas.js';

export function parseStatusBody(body: unknown): { order_id: string } {
  const result = StatusRequestSchema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ValidationError(first.message, String(first.path[0] ?? 'request'));
  }
  return result.data;
}

export async function handleStatus(body: { order_id: string }) {
  if (!body.order_id) throw new ValidationError('order_id is required', 'order_id');

  const order = await loadOrder(body.order_id);
  if (!order) throw new ValidationError('order not found', 'order_id');

  const status: 'completed' | 'cancelled' =
    order.etg_status === 'cancelled' ? 'cancelled' : 'completed';

  const response: Record<string, unknown> = {
    order_id: order.order_id,
    status,
    start_time: order.start_time,
    price: { amount: order.price_amount, currency: order.price_currency },
    passengers: order.passengers,
    luggage_places: order.luggage_places,
    included_waiting_time_minutes: order.included_waiting_time_minutes,
    transfer_category: order.transfer_category,
    free_cancel_until: order.free_cancel_until,
    buffer_time_minutes: order.buffer_time_minutes,
    comment: order.comment ?? undefined,
    shield_text: order.shield_text ?? undefined,
    main_passenger: order.main_passenger,
  };

  if (order.sport_luggage_places) response.sport_luggage_places = order.sport_luggage_places;
  if (order.animals) response.animals = order.animals;
  if (order.wheelchairs_places) response.wheelchairs_places = order.wheelchairs_places;
  if (order.children_seat_0) response.children_seat_0 = order.children_seat_0;
  if (order.children_seat_1) response.children_seat_1 = order.children_seat_1;
  if (order.children_seat_2) response.children_seat_2 = order.children_seat_2;
  if (order.children_seat_3) response.children_seat_3 = order.children_seat_3;
  if (order.driver_info) response.driver_info = order.driver_info;
  if (order.car_info) response.car_info = order.car_info;
  if (order.meeting_info) response.meeting_info = order.meeting_info;

  return response;
}
