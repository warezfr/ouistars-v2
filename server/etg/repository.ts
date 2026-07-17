import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { memoryStore } from './store/memory.js';
import type {
  EtgOffer,
  SearchRequest,
  StoredOrder,
  RateCard,
  AirportMapping,
  CoverageZone,
  BookRequest,
} from './types.js';

let supabase: SupabaseClient | null = null;
let warnedNoSupabase = false;

/**
 * Client Supabase service-role, ou `null` si non configuré.
 * Sans Supabase, toute l'API bascule sur le store mémoire (offres/commandes)
 * et les journaux d'appels sont ignorés — l'API reste pleinement fonctionnelle
 * (recherche, réservation, statut, annulation, certification ETG).
 */
function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    if (!warnedNoSupabase) {
      console.warn('[ETG] Supabase non configuré (SUPABASE_SERVICE_ROLE_KEY manquant) — repli sur le store mémoire.');
      warnedNoSupabase = true;
    }
    return null;
  }
  if (!supabase) {
    supabase = createClient(url, key, {
      db: { schema: 'public' },
      global: {
        fetch: (input, init) => fetch(input, {
          ...init,
          signal: AbortSignal.timeout(8000), // 8 seconds max
        }),
      },
    });
  }
  return supabase;
}

export async function getPricingContext(): Promise<{
  rateCards: RateCard[];
  airports: AirportMapping[];
  zones: CoverageZone[];
}> {
  const db = getSupabase();
  if (!db) {
    return {
      rateCards: memoryStore.getRateCards(),
      airports: memoryStore.getAirports(),
      zones: memoryStore.getZones(),
    };
  }

  const [cards, airports, zones] = await Promise.all([
    db.from('etg_rate_cards').select('*').eq('active', true),
    db.from('etg_airport_mappings').select('*'),
    db.from('etg_coverage_zones').select('*').eq('active', true),
  ]);

  if (cards.error || airports.error || zones.error || !cards.data?.length) {
    return {
      rateCards: memoryStore.getRateCards(),
      airports: memoryStore.getAirports(),
      zones: memoryStore.getZones(),
    };
  }

  return {
    rateCards: cards.data.map(mapRateCard),
    airports: airports.data as AirportMapping[],
    zones: zones.data as CoverageZone[],
  };
}

function mapRateCard(row: Record<string, unknown>): RateCard {
  return {
    id: String(row.id),
    route_key: String(row.route_key),
    start_type: String(row.start_type),
    start_value: String(row.start_value),
    end_type: String(row.end_type),
    end_value: String(row.end_value),
    transfer_category: row.transfer_category as RateCard['transfer_category'],
    base_price: Number(row.base_price),
    currency: String(row.currency),
    seats: Number(row.seats),
    luggage_places: Number(row.luggage_places),
    car_model: String(row.car_model),
    included_waiting_time_minutes: Number(row.included_waiting_time_minutes),
    free_cancel_hours: Number(row.free_cancel_hours),
    min_lead_time_hours: Number(row.min_lead_time_hours),
    tolls_included: Boolean(row.tolls_included),
    gratuity_included: Boolean(row.gratuity_included),
    meet_greet_included: Boolean(row.meet_greet_included),
    child_seat_price: Number(row.child_seat_price),
    max_child_seats: Number(row.max_child_seats),
    active: Boolean(row.active ?? true),
  };
}

export async function persistOffer(offer: EtgOffer, search: SearchRequest, expiresAt: string) {
  memoryStore.saveOffer(offer.id, offer, search, expiresAt);
  const db = getSupabase();
  if (!db) return;
  await db.from('etg_offers').upsert({
    offer_id: offer.id,
    search_hash: hashSearch(search),
    payload: { offer, search },
    expires_at: expiresAt,
  });
}

export async function loadOffer(offerId: string) {
  const mem = memoryStore.getOffer(offerId);
  if (mem) return mem;

  const db = getSupabase();
  if (!db) return null;

  const { data } = await db.from('etg_offers').select('*').eq('offer_id', offerId).maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  const payload = data.payload as { offer: EtgOffer; search: SearchRequest };
  memoryStore.saveOffer(offerId, payload.offer, payload.search, data.expires_at);
  return memoryStore.getOffer(offerId);
}

export async function persistOrder(order: StoredOrder) {
  memoryStore.saveOrder(order);
  const db = getSupabase();
  if (!db) return;
  await db.from('etg_orders').upsert({
    order_id: order.order_id,
    offer_id: order.offer_id,
    status: order.status,
    etg_status: order.etg_status,
    price_amount: order.price_amount,
    price_currency: order.price_currency,
    start_time: order.start_time,
    passengers: order.passengers,
    luggage_places: order.luggage_places,
    sport_luggage_places: order.sport_luggage_places,
    animals: order.animals,
    wheelchairs_places: order.wheelchairs_places,
    children_seat_0: order.children_seat_0,
    children_seat_1: order.children_seat_1,
    children_seat_2: order.children_seat_2,
    children_seat_3: order.children_seat_3,
    transfer_category: order.transfer_category,
    distance: order.distance,
    estimated_duration_minutes: order.estimated_duration_minutes,
    included_waiting_time_minutes: order.included_waiting_time_minutes,
    free_cancel_until: order.free_cancel_until,
    flight_number: order.flight_number,
    shield_text: order.shield_text,
    comment: order.comment,
    main_passenger: order.main_passenger,
    book_payload: order.book_payload,
    search_payload: order.search_payload,
    upsells: order.upsells,
    driver_info: order.driver_info,
    car_info: order.car_info,
    meeting_info: order.meeting_info,
    meeting_instructions: order.meeting_instructions,
    meeting_images: order.meeting_images,
    buffer_time_minutes: order.buffer_time_minutes,
    penalty_amount: order.penalty_amount,
    supplier_link: order.supplier_link,
    workflow_status: order.workflow_status ?? 'pending',
    updated_at: order.updated_at,
  });
  await db.from('etg_order_events').insert({
    order_id: order.order_id,
    event_type: 'created',
    actor: 'system',
  });
}

export async function loadOrder(orderId: string): Promise<StoredOrder | null> {
  const mem = memoryStore.getOrder(orderId);
  if (mem) return mem;

  const db = getSupabase();
  if (!db) return null;

  const { data } = await db.from('etg_orders').select('*').eq('order_id', orderId).maybeSingle();
  if (!data) return null;

  const order = mapOrder(data);
  memoryStore.saveOrder(order);
  return order;
}

export async function updateOrder(orderId: string, patch: Partial<StoredOrder>): Promise<StoredOrder | null> {
  const updated = memoryStore.updateOrder(orderId, patch);
  if (!updated) return null;

  const db = getSupabase();
  if (db) {
    await db.from('etg_orders').update(patch).eq('order_id', orderId);
  }
  return updated;
}

export async function listOrders(): Promise<StoredOrder[]> {
  const db = getSupabase();
  if (!db) return memoryStore.listOrders();

  const { data } = await db.from('etg_orders').select('*').order('created_at', { ascending: false }).limit(200);
  if (!data?.length) return memoryStore.listOrders();
  return data.map(mapOrder);
}

export async function logApiCall(endpoint: string, method: string, statusCode: number, durationMs: number, error?: string) {
  const db = getSupabase();
  if (!db) return;
  await db.from('etg_api_logs').insert({
    endpoint,
    method,
    status_code: statusCode,
    duration_ms: durationMs,
    error_message: error ?? null,
  });
}

function hashSearch(search: SearchRequest): string {
  return JSON.stringify({
    s: search.start_point,
    e: search.end_point,
    t: search.start_date_time,
    p: search.passengers,
    c: [search.children_seat_0, search.children_seat_1, search.children_seat_2, search.children_seat_3],
  });
}

function mapOrder(row: Record<string, unknown>): StoredOrder {
  return {
    order_id: String(row.order_id),
    offer_id: String(row.offer_id),
    status: String(row.status),
    etg_status: row.etg_status as StoredOrder['etg_status'],
    price_amount: Number(row.price_amount),
    price_currency: String(row.price_currency),
    start_time: String(row.start_time),
    passengers: Number(row.passengers),
    luggage_places: Number(row.luggage_places),
    sport_luggage_places: Number(row.sport_luggage_places ?? 0),
    animals: Number(row.animals ?? 0),
    wheelchairs_places: Number(row.wheelchairs_places ?? 0),
    children_seat_0: Number(row.children_seat_0 ?? 0),
    children_seat_1: Number(row.children_seat_1 ?? 0),
    children_seat_2: Number(row.children_seat_2 ?? 0),
    children_seat_3: Number(row.children_seat_3 ?? 0),
    transfer_category: row.transfer_category as StoredOrder['transfer_category'],
    distance: Number(row.distance ?? 0),
    estimated_duration_minutes: Number(row.estimated_duration_minutes ?? 0),
    included_waiting_time_minutes: Number(row.included_waiting_time_minutes),
    free_cancel_until: row.free_cancel_until ? String(row.free_cancel_until) : null,
    flight_number: row.flight_number ? String(row.flight_number) : null,
    shield_text: row.shield_text ? String(row.shield_text) : null,
    comment: row.comment ? String(row.comment) : null,
    main_passenger: row.main_passenger as BookRequest['main_passenger'],
    book_payload: row.book_payload as BookRequest,
    search_payload: row.search_payload as SearchRequest,
    upsells: (row.upsells as StoredOrder['upsells']) ?? [],
    driver_info: row.driver_info as StoredOrder['driver_info'],
    car_info: row.car_info as StoredOrder['car_info'],
    meeting_info: row.meeting_info as StoredOrder['meeting_info'],
    meeting_instructions: row.meeting_instructions ? String(row.meeting_instructions) : null,
    meeting_images: row.meeting_images as string[] | null,
    buffer_time_minutes: Number(row.buffer_time_minutes ?? 0),
    penalty_amount: row.penalty_amount != null ? Number(row.penalty_amount) : null,
    supplier_link: String(row.supplier_link),
    driver_id: row.driver_id ? String(row.driver_id) : null,
    vehicle_id: row.vehicle_id ? String(row.vehicle_id) : null,
    workflow_status: row.workflow_status ? String(row.workflow_status) : undefined,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export { memoryStore };
