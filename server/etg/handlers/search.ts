import type { SearchRequest } from '../types.js';
import { buildSearchOffers, ValidationError, getOfferExpiry } from '../pricing/engine.js';
import { getPricingContext, persistOffer } from '../repository.js';

export async function handleSearch(body: SearchRequest) {
  const ctx = await getPricingContext();
  const result = await buildSearchOffers(body, ctx);
  const searchWithFormatted = { ...body, start_date_time: result.start_date_time };

  for (const offer of result.offers) {
    const card = ctx.rateCards.find(c => c.id === offer.rate_card_id);
    const minLead = card?.min_lead_time_hours ?? 6;
    const expires = getOfferExpiry(body.start_date_time, minLead).toISOString();
    await persistOffer(offer, searchWithFormatted, expires);
  }

  return result;
}

import { SearchRequestSchema } from '../schemas.js';

export function parseSearchBody(body: unknown): SearchRequest {
  const result = SearchRequestSchema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ValidationError(first.message, String(first.path[0] ?? 'request'));
  }
  return result.data as SearchRequest;
}
