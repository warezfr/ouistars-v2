import { z } from 'zod';
import { sanitizeText } from './sanitize.js';

const GeoPointSchema = z.object({
  type: z.enum(['iata', 'coordinates']),
  iata: z.string().max(4).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).transform(sanitizeText).optional(),
}).refine(
  data => data.type === 'iata' ? !!data.iata : (data.latitude != null && data.longitude != null),
  { message: 'iata type requires iata code; coordinates type requires lat/lng' },
);

export const SearchRequestSchema = z.object({
  start_date_time: z.string().min(1, 'start_date_time is required')
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Invalid date format'),
  passengers: z.number().int().min(1, 'passengers must be greater than 0'),
  children_seat_0: z.number().int().min(0).default(0),
  children_seat_1: z.number().int().min(0).default(0),
  children_seat_2: z.number().int().min(0).default(0),
  children_seat_3: z.number().int().min(0).default(0),
  start_point: GeoPointSchema,
  end_point: GeoPointSchema,
});

export const BookRequestSchema = z.object({
  offer_id: z.string().min(1, 'offer_id is required'),
  start_point: GeoPointSchema,
  end_point: GeoPointSchema,
  passengers: z.number().int().min(1),
  luggage_places: z.number().int().min(0),
  sport_luggage_places: z.number().int().min(0).optional(),
  animals: z.number().int().min(0).optional(),
  wheelchairs_places: z.number().int().min(0).optional(),
  children_seat_0: z.number().int().min(0).optional(),
  children_seat_1: z.number().int().min(0).optional(),
  children_seat_2: z.number().int().min(0).optional(),
  children_seat_3: z.number().int().min(0).optional(),
  main_passenger: z.object({
    first_name: z.string().min(1, 'first_name is required'),
    last_name: z.string().min(1, 'last_name is required'),
    phone_number: z.string().min(1, 'phone_number is required'),
    email: z.string().email().optional(),
  }),
  flight_number: z.string().max(20)
    .refine(v => v === 'No flight' || /^[A-Z0-9]{2,3}\d{1,5}$/.test(v), {
      message: 'flight_number must be "No flight" or a valid flight number (e.g., LH1234)',
    })
    .optional(),
  shield_text: z.string().max(1000).transform(sanitizeText).optional(),
  comment: z.string().max(2000).transform(sanitizeText).optional(),
  upsells: z.array(z.object({
    id: z.string(),
    count: z.number().int().min(1),
  })).optional(),
});

export const StatusRequestSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
});

export const CancelRequestSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
});
