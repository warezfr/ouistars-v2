export type TransferCategory =
  | 'micro' | 'economy' | 'economy_mpv_new' | 'economy_mpv' | 'economy_van'
  | 'minibus' | 'business' | 'business_mpv' | 'business_van' | 'first' | 'bus'
  | 'electro_micro' | 'electro_economy' | 'electro_economy_mpv'
  | 'electro_comfort' | 'electro_economy_van' | 'electro_minibus'
  | 'electro_business' | 'electro_business_mpv' | 'electro_business_van'
  | 'electro_first' | 'electro_bus';

export type PointType = 'iata' | 'coordinates';

export interface GeoPoint {
  type: PointType;
  iata?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface SearchRequest {
  start_date_time: string;
  passengers: number;
  children_seat_0?: number;
  children_seat_1?: number;
  children_seat_2?: number;
  children_seat_3?: number;
  start_point: GeoPoint & { address?: string };
  end_point: GeoPoint & { address?: string };
}

export interface Upsell {
  id: string;
  type: string;
  price: number;
  count: number;
  max_count: number;
}

export interface EtgOffer {
  id: string;
  transfer_category: TransferCategory;
  car_model: string;
  seats: number;
  luggage_places: number;
  distance: number;
  estimated_duration_minutes: number;
  included_waiting_time_minutes: number;
  tolls_included: boolean;
  gratuity_included: boolean;
  free_cancel_until: string;
  price: { amount: number; currency: string };
  children_seat_0: number;
  children_seat_1: number;
  children_seat_2: number;
  children_seat_3: number;
  upsells: Upsell[];
  rate_card_id?: string;
}

export interface SearchResponse {
  start_date_time: string;
  offers: EtgOffer[];
}

export interface BookRequest {
  offer_id: string;
  start_point: GeoPoint & { address?: string };
  end_point: GeoPoint & { address?: string };
  passengers: number;
  luggage_places: number;
  sport_luggage_places?: number;
  animals?: number;
  animals_places?: number;
  wheelchairs_places?: number;
  children_seat_0?: number;
  children_seat_1?: number;
  children_seat_2?: number;
  children_seat_3?: number;
  main_passenger: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email?: string;
  };
  flight_number?: string;
  shield_text?: string;
  comment?: string;
  upsells?: { id: string; count: number }[];
}

export interface BookResponse {
  order_id: string;
  supplier_link: string;
  start_time: string;
  distance: number;
  estimated_duration_minutes: number;
  included_waiting_time_minutes: number;
  passengers: number;
  luggage_places: number;
  price: { amount: number; currency: string };
  children_seat_0?: number;
  children_seat_1?: number;
  children_seat_2?: number;
  children_seat_3?: number;
  sport_luggage_places?: number;
  animals?: number;
  wheelchairs_places?: number;
  upsells?: Upsell[];
  meeting_instructions?: string;
  meeting_images?: string[];
  buffer_time_minutes?: number;
}

export interface StatusRequest {
  order_id: string;
}

export interface StatusResponse {
  order_id: string;
  status: 'completed' | 'cancelled';
  start_time: string;
  price: { amount: number; currency: string };
  passengers?: number;
  luggage_places?: number;
  included_waiting_time_minutes?: number;
  driver_info?: {
    phone: string;
    first_name?: string;
    last_name?: string;
    carrier_company_name?: string;
  } | null;
  car_info?: {
    car_model: string;
    plate_number: string;
    color?: string;
  } | null;
  meeting_info?: {
    instructions?: string;
    images?: string[];
  } | null;
  main_passenger?: BookRequest['main_passenger'];
  comment?: string;
  shield_text?: string;
  transfer_category?: TransferCategory;
  free_cancel_until?: string;
  buffer_time_minutes?: number;
}

export interface CancelRequest {
  order_id: string;
}

export interface CancelResponse {
  order_id: string;
  penalty: { amount: number; currency: string };
}

export interface EtgErrorResponse {
  code: string;
  error: string;
}

export interface RateCard {
  id: string;
  route_key: string;
  start_type: string;
  start_value: string;
  end_type: string;
  end_value: string;
  transfer_category: TransferCategory;
  base_price: number;
  currency: string;
  seats: number;
  luggage_places: number;
  car_model: string;
  included_waiting_time_minutes: number;
  free_cancel_hours: number;
  min_lead_time_hours: number;
  tolls_included: boolean;
  gratuity_included: boolean;
  meet_greet_included: boolean;
  child_seat_price: number;
  max_child_seats: number;
  active?: boolean;
}

export interface AirportMapping {
  iata_code: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  buffer_time_minutes: number;
}

export interface CoverageZone {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  timezone: string;
}

export interface StoredOrder {
  order_id: string;
  offer_id: string;
  status: string;
  etg_status: 'completed' | 'cancelled' | 'confirmed';
  price_amount: number;
  price_currency: string;
  start_time: string;
  passengers: number;
  luggage_places: number;
  sport_luggage_places: number;
  animals: number;
  wheelchairs_places: number;
  children_seat_0: number;
  children_seat_1: number;
  children_seat_2: number;
  children_seat_3: number;
  transfer_category: TransferCategory;
  distance: number;
  estimated_duration_minutes: number;
  included_waiting_time_minutes: number;
  free_cancel_until: string | null;
  flight_number: string | null;
  shield_text: string | null;
  comment: string | null;
  main_passenger: BookRequest['main_passenger'];
  book_payload: BookRequest;
  search_payload: SearchRequest;
  upsells: Upsell[];
  driver_info: StatusResponse['driver_info'];
  car_info: StatusResponse['car_info'];
  meeting_info: StatusResponse['meeting_info'];
  meeting_instructions: string | null;
  meeting_images: string[] | null;
  buffer_time_minutes: number;
  penalty_amount: number | null;
  supplier_link: string;
  driver_id?: string | null;
  vehicle_id?: string | null;
  workflow_status?: string;
  created_at: string;
  updated_at: string;
}
