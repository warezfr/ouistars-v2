import { loadOrder, updateOrder } from '../repository.js';
import { ValidationError } from '../pricing/engine.js';

import { CancelRequestSchema } from '../schemas.js';

export function parseCancelBody(body: unknown): { order_id: string } {
  const result = CancelRequestSchema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ValidationError(first.message, String(first.path[0] ?? 'request'));
  }
  return result.data;
}

export async function handleCancel(body: { order_id: string }) {
  if (!body.order_id) throw new ValidationError('order_id is required', 'order_id');

  const order = await loadOrder(body.order_id);
  if (!order) throw new ValidationError('order not found', 'order_id');

  let penaltyAmount = 0;
  if (order.free_cancel_until) {
    const freeUntil = new Date(order.free_cancel_until);
    if (Date.now() > freeUntil.getTime()) {
      penaltyAmount = order.price_amount;
    }
  }

  await updateOrder(order.order_id, {
    status: 'cancelled',
    etg_status: 'cancelled',
    penalty_amount: penaltyAmount,
  });

  return {
    order_id: order.order_id,
    penalty: { amount: penaltyAmount, currency: order.price_currency },
  };
}
