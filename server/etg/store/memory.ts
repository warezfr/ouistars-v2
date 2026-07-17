import type { AirportMapping, CoverageZone, RateCard, StoredOrder, EtgOffer, SearchRequest } from '../types.js';

const AIRPORTS: AirportMapping[] = [
  { iata_code: 'CDG', name: 'Paris Charles de Gaulle', latitude: 49.0097, longitude: 2.5479, timezone: 'Europe/Paris', buffer_time_minutes: 45 },
  { iata_code: 'ORY', name: 'Paris Orly', latitude: 48.7262, longitude: 2.3652, timezone: 'Europe/Paris', buffer_time_minutes: 45 },
  { iata_code: 'LBG', name: 'Paris Le Bourget', latitude: 48.9694, longitude: 2.4414, timezone: 'Europe/Paris', buffer_time_minutes: 30 },
  { iata_code: 'NCE', name: "Nice Côte d'Azur", latitude: 43.6584, longitude: 7.2159, timezone: 'Europe/Paris', buffer_time_minutes: 45 },
];

const ZONES: CoverageZone[] = [
  { id: 'paris', name: 'Paris & Île-de-France', center_lat: 48.8566, center_lng: 2.3522, radius_km: 55, timezone: 'Europe/Paris' },
  { id: 'riviera', name: 'French Riviera', center_lat: 43.7102, center_lng: 7.2620, radius_km: 80, timezone: 'Europe/Paris' },
];

const RATE_CARDS: RateCard[] = [
  { id: '1', route_key: 'cdg-paris-business', start_type: 'iata', start_value: 'CDG', end_type: 'zone', end_value: 'paris', transfer_category: 'business', base_price: 130, currency: 'EUR', seats: 3, luggage_places: 3, car_model: 'Mercedes E Class, Lexus ES', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '2', route_key: 'cdg-paris-business-van', start_type: 'iata', start_value: 'CDG', end_type: 'zone', end_value: 'paris', transfer_category: 'business_van', base_price: 140, currency: 'EUR', seats: 7, luggage_places: 7, car_model: 'Mercedes V Class', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '3', route_key: 'cdg-paris-first', start_type: 'iata', start_value: 'CDG', end_type: 'zone', end_value: 'paris', transfer_category: 'first', base_price: 230, currency: 'EUR', seats: 2, luggage_places: 2, car_model: 'Mercedes S Class, Mercedes Maybach', included_waiting_time_minutes: 90, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 2 },
  { id: '4', route_key: 'cdg-paris-electro', start_type: 'iata', start_value: 'CDG', end_type: 'zone', end_value: 'paris', transfer_category: 'electro_business', base_price: 150, currency: 'EUR', seats: 3, luggage_places: 3, car_model: 'Mercedes-Benz EQE', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '5', route_key: 'cdg-paris-minibus', start_type: 'iata', start_value: 'CDG', end_type: 'zone', end_value: 'paris', transfer_category: 'minibus', base_price: 280, currency: 'EUR', seats: 12, luggage_places: 12, car_model: 'Mercedes Sprinter', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 12, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '6', route_key: 'ory-paris-business', start_type: 'iata', start_value: 'ORY', end_type: 'zone', end_value: 'paris', transfer_category: 'business', base_price: 130, currency: 'EUR', seats: 3, luggage_places: 3, car_model: 'Mercedes E Class, Lexus ES', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '7', route_key: 'ory-paris-business-van', start_type: 'iata', start_value: 'ORY', end_type: 'zone', end_value: 'paris', transfer_category: 'business_van', base_price: 140, currency: 'EUR', seats: 7, luggage_places: 7, car_model: 'Mercedes V Class', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '8', route_key: 'ory-paris-first', start_type: 'iata', start_value: 'ORY', end_type: 'zone', end_value: 'paris', transfer_category: 'first', base_price: 230, currency: 'EUR', seats: 2, luggage_places: 2, car_model: 'Mercedes S Class', included_waiting_time_minutes: 90, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 2 },
  { id: '9', route_key: 'lbg-paris-business', start_type: 'iata', start_value: 'LBG', end_type: 'zone', end_value: 'paris', transfer_category: 'business', base_price: 130, currency: 'EUR', seats: 3, luggage_places: 3, car_model: 'Mercedes E Class', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '10', route_key: 'paris-cdg-business', start_type: 'zone', start_value: 'paris', end_type: 'iata', end_value: 'CDG', transfer_category: 'business', base_price: 130, currency: 'EUR', seats: 3, luggage_places: 3, car_model: 'Mercedes E Class, Lexus ES', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '11', route_key: 'paris-cdg-business-van', start_type: 'zone', start_value: 'paris', end_type: 'iata', end_value: 'CDG', transfer_category: 'business_van', base_price: 140, currency: 'EUR', seats: 7, luggage_places: 7, car_model: 'Mercedes V Class', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '12', route_key: 'paris-ory-business', start_type: 'zone', start_value: 'paris', end_type: 'iata', end_value: 'ORY', transfer_category: 'business', base_price: 130, currency: 'EUR', seats: 3, luggage_places: 3, car_model: 'Mercedes E Class', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '13', route_key: 'cdg-ory-business', start_type: 'iata', start_value: 'CDG', end_type: 'iata', end_value: 'ORY', transfer_category: 'business', base_price: 180, currency: 'EUR', seats: 3, luggage_places: 3, car_model: 'Mercedes E Class', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '14', route_key: 'gare-nord-paris-business', start_type: 'coords', start_value: '48.8809,2.3553', end_type: 'zone', end_value: 'paris', transfer_category: 'business', base_price: 65, currency: 'EUR', seats: 3, luggage_places: 2, car_model: 'Mercedes E Class', included_waiting_time_minutes: 30, free_cancel_hours: 24, min_lead_time_hours: 2, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '15', route_key: 'paris-versailles-business', start_type: 'zone', start_value: 'paris', end_type: 'coords', end_value: '48.8049,2.1204', transfer_category: 'business', base_price: 230, currency: 'EUR', seats: 3, luggage_places: 3, car_model: 'Mercedes E Class', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '16', route_key: 'nce-monaco-business', start_type: 'iata', start_value: 'NCE', end_type: 'coords', end_value: '43.7384,7.4246', transfer_category: 'business', base_price: 160, currency: 'EUR', seats: 3, luggage_places: 2, car_model: 'Mercedes E Class, Lexus ES', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '17', route_key: 'nce-cannes-business', start_type: 'iata', start_value: 'NCE', end_type: 'coords', end_value: '43.5528,7.0174', transfer_category: 'business', base_price: 140, currency: 'EUR', seats: 3, luggage_places: 2, car_model: 'Mercedes E Class', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '18', route_key: 'nce-monaco-business-van', start_type: 'iata', start_value: 'NCE', end_type: 'coords', end_value: '43.7384,7.4246', transfer_category: 'business_van', base_price: 180, currency: 'EUR', seats: 7, luggage_places: 7, car_model: 'Mercedes V Class', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
  { id: '19', route_key: 'monaco-nce-business', start_type: 'coords', start_value: '43.7384,7.4246', end_type: 'iata', end_value: 'NCE', transfer_category: 'business', base_price: 160, currency: 'EUR', seats: 3, luggage_places: 2, car_model: 'Mercedes E Class', included_waiting_time_minutes: 60, free_cancel_hours: 24, min_lead_time_hours: 6, tolls_included: true, gratuity_included: true, meet_greet_included: true, child_seat_price: 15, max_child_seats: 3 },
];

const offers = new Map<string, { offer: EtgOffer; search: SearchRequest; expires_at: string }>();
const orders = new Map<string, StoredOrder>();
const orderEvents: { order_id: string; event_type: string; actor?: string; payload?: unknown; created_at: string }[] = [];

export const memoryStore = {
  getAirports(): AirportMapping[] {
    return AIRPORTS;
  },
  getZones(): CoverageZone[] {
    return ZONES;
  },
  getRateCards(): RateCard[] {
    return RATE_CARDS;
  },
  saveOffer(offerId: string, offer: EtgOffer, search: SearchRequest, expiresAt: string) {
    offers.set(offerId, { offer, search, expires_at: expiresAt });
  },
  getOffer(offerId: string) {
    const row = offers.get(offerId);
    if (!row) return null;
    if (new Date(row.expires_at) < new Date()) {
      offers.delete(offerId);
      return null;
    }
    return row;
  },
  saveOrder(order: StoredOrder) {
    orders.set(order.order_id, order);
    orderEvents.push({ order_id: order.order_id, event_type: 'created', actor: 'system', created_at: new Date().toISOString() });
  },
  getOrder(orderId: string) {
    return orders.get(orderId) ?? null;
  },
  updateOrder(orderId: string, patch: Partial<StoredOrder>) {
    const existing = orders.get(orderId);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updated_at: new Date().toISOString() };
    orders.set(orderId, updated);
    return updated;
  },
  listOrders() {
    return [...orders.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  addEvent(orderId: string, eventType: string, actor?: string, payload?: unknown) {
    orderEvents.push({ order_id: orderId, event_type: eventType, actor, payload, created_at: new Date().toISOString() });
  },
  getEvents(orderId: string) {
    return orderEvents.filter(e => e.order_id === orderId);
  },
  clear() {
    offers.clear();
    orders.clear();
    orderEvents.length = 0;
  },
};
