import { createClient } from '@supabase/supabase-js';
import {
  ROUTE_RATES, HOURLY_RATES, HOURLY_MIN_HOURS, PER_KM_RATES, MEET_GREET_RATES,
  type RouteRate, type VehicleClass, type RouteCategory, type MeetGreetRate,
} from '../../src/data/pricing.js';

/**
 * Tarification vivante côté SERVEUR : les prix officiels calculés par l'API
 * (/api/intake — réservations et Meet & Greeter) suivent le Salon de
 * tarification du back-office. Lecture Supabase (service role) avec cache
 * 60 s ; repli silencieux sur la grille statique embarquée.
 */

export interface LivePricing {
  routes: RouteRate[];
  hourly: Record<VehicleClass, number>;
  perKm: Record<VehicleClass, number>;
  minHours: number;
  greeter: MeetGreetRate[];
}

const STATIC: LivePricing = {
  routes: ROUTE_RATES,
  hourly: HOURLY_RATES,
  perKm: PER_KM_RATES,
  minHours: HOURLY_MIN_HOURS,
  greeter: MEET_GREET_RATES,
};

let cache: { at: number; data: LivePricing } | null = null;
const TTL = 60_000;

export async function getLivePricing(): Promise<LivePricing> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return STATIC;

  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const [routes, rates, greeter] = await Promise.all([
      db.from('cms_entries').select('data, position')
        .eq('collection', 'route').eq('status', 'published')
        .order('position', { ascending: true }),
      db.from('cms_singletons').select('data').eq('key', 'rates').maybeSingle(),
      db.from('cms_entries').select('data, position')
        .eq('collection', 'greeter_rate').eq('status', 'published')
        .order('position', { ascending: true }),
    ]);

    const live: LivePricing = {
      routes: STATIC.routes, hourly: { ...STATIC.hourly }, perKm: { ...STATIC.perKm },
      minHours: STATIC.minHours, greeter: STATIC.greeter,
    };

    if (!routes.error && routes.data && routes.data.length > 0) {
      const mapped: RouteRate[] = [];
      for (const r of routes.data) {
        const d = r.data as { label?: string; routeId?: string; category?: string; priceE?: number; priceV?: number; priceS?: number; note?: string };
        if (!d?.routeId || !d.label || d.priceE == null || d.priceV == null || d.priceS == null) continue;
        mapped.push({
          id: d.routeId, label: d.label,
          category: (d.category as RouteCategory) || 'city-to-city',
          prices: { E: Number(d.priceE), V: Number(d.priceV), S: Number(d.priceS) },
          note: d.note || undefined,
        });
      }
      if (mapped.length > 0) live.routes = mapped;
    }

    const rd = rates.data?.data as Record<string, number> | undefined;
    if (!rates.error && rd) {
      if (rd.hourlyE) live.hourly.E = Number(rd.hourlyE);
      if (rd.hourlyV) live.hourly.V = Number(rd.hourlyV);
      if (rd.hourlyS) live.hourly.S = Number(rd.hourlyS);
      if (rd.kmE) live.perKm.E = Number(rd.kmE);
      if (rd.kmV) live.perKm.V = Number(rd.kmV);
      if (rd.kmS) live.perKm.S = Number(rd.kmS);
      if (rd.hourlyMin) live.minHours = Math.max(1, Number(rd.hourlyMin));
    }

    if (!greeter.error && greeter.data && greeter.data.length > 0) {
      const mg: MeetGreetRate[] = [];
      for (const g of greeter.data) {
        const d = g.data as { airport?: string; rateId?: string; base?: number | null; includedPax?: number; extraPaxSurcharge?: number | null };
        if (!d?.rateId || !d.airport) continue;
        mg.push({
          id: d.rateId, airport: d.airport,
          base: d.base != null ? Number(d.base) : null,
          includedPax: d.includedPax != null ? Number(d.includedPax) : 3,
          includedBags: d.includedPax != null ? Number(d.includedPax) : 3,
          extraPaxSurcharge: d.extraPaxSurcharge != null ? Number(d.extraPaxSurcharge) : null,
        });
      }
      if (mg.length > 0) live.greeter = mg;
    }

    cache = { at: Date.now(), data: live };
    return live;
  } catch {
    return cache?.data ?? STATIC;
  }
}
