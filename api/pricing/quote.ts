import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ROUTE_RATES, HOURLY_RATES, HOURLY_MIN_HOURS, PER_KM_RATES, type VehicleClass } from '../../src/data/pricing.js';

/**
 * Calcule un tarif à partir de la grille officielle 2026-2027.
 * POST { routeId?, vehicleClass, hours?, km? }
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { routeId, vehicleClass, hours, km } = (req.body ?? {}) as
    { routeId?: string; vehicleClass?: VehicleClass; hours?: number; km?: number };
  const vc = (vehicleClass ?? 'E') as VehicleClass;

  if (routeId) {
    const route = ROUTE_RATES.find((r) => r.id === routeId);
    if (route) return res.status(200).json({ amount: route.prices[vc], currency: 'EUR', basis: 'fixed-route', label: route.label });
  }
  if (hours && hours > 0) {
    const h = Math.max(hours, HOURLY_MIN_HOURS);
    return res.status(200).json({ amount: h * HOURLY_RATES[vc], currency: 'EUR', basis: 'hourly', hours: h });
  }
  if (km && km > 0) {
    return res.status(200).json({ amount: Math.round(km * PER_KM_RATES[vc] * 100) / 100, currency: 'EUR', basis: 'per-km' });
  }
  return res.status(400).json({ error: 'Fournir routeId, hours ou km' });
}
