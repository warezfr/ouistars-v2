import { useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ROUTE_RATES, HOURLY_RATES, PER_KM_RATES, MEET_GREET_RATES,
  type RouteRate, type VehicleClass, type RouteCategory, type MeetGreetRate,
} from '@/data/pricing';

/**
 * Synchronisation de la grille tarifaire avec le back-office (CMS Supabase).
 * Les trajets (collection « route ») et les tarifs horaires/km (singleton « rates »)
 * édités dans /admin remplacent la grille statique — calculateur, wizard,
 * sections tarifaires et forfaits inclus. Repli : grille statique embarquée.
 */
let version = 0;
const listeners = new Set<() => void>();
const bump = () => { version++; listeners.forEach((l) => l()); };

let started = false;

interface RouteRow {
  label?: string; routeId?: string; category?: string;
  priceE?: number; priceV?: number; priceS?: number; note?: string;
}

export async function initLivePricing(): Promise<void> {
  if (started || !supabase) return;
  started = true;
  try {
    const [routes, rates, greeter] = await Promise.all([
      supabase.from('cms_entries').select('data, position')
        .eq('collection', 'route').eq('status', 'published')
        .order('position', { ascending: true }),
      supabase.from('cms_singletons').select('data').eq('key', 'rates').maybeSingle(),
      supabase.from('cms_entries').select('data, position')
        .eq('collection', 'greeter_rate').eq('status', 'published')
        .order('position', { ascending: true }),
    ]);

    if (!routes.error && routes.data && routes.data.length > 0) {
      const mapped: RouteRate[] = [];
      for (const r of routes.data) {
        const d = r.data as RouteRow;
        if (!d?.routeId || !d.label) continue;
        if (d.priceE == null || d.priceV == null || d.priceS == null) continue;
        mapped.push({
          id: d.routeId,
          label: d.label,
          category: (d.category as RouteCategory) || 'city-to-city',
          prices: { E: Number(d.priceE), V: Number(d.priceV), S: Number(d.priceS) } as Record<VehicleClass, number>,
          note: d.note || undefined,
        });
      }
      if (mapped.length > 0) {
        ROUTE_RATES.splice(0, ROUTE_RATES.length, ...mapped); // remplacement in-place
      }
    }

    const rd = rates.data?.data as Record<string, number> | undefined;
    if (!rates.error && rd) {
      if (rd.hourlyE) HOURLY_RATES.E = Number(rd.hourlyE);
      if (rd.hourlyV) HOURLY_RATES.V = Number(rd.hourlyV);
      if (rd.hourlyS) HOURLY_RATES.S = Number(rd.hourlyS);
      if (rd.kmE) PER_KM_RATES.E = Number(rd.kmE);
      if (rd.kmV) PER_KM_RATES.V = Number(rd.kmV);
      if (rd.kmS) PER_KM_RATES.S = Number(rd.kmS);
    }

    // Tarifs Meet & Greeter — remplacement in-place (section + wizard + serveur).
    if (!greeter.error && greeter.data && greeter.data.length > 0) {
      const mg: MeetGreetRate[] = [];
      for (const g of greeter.data) {
        const d = g.data as { airport?: string; rateId?: string; base?: number | null; includedPax?: number; extraPaxSurcharge?: number | null };
        if (!d?.rateId || !d.airport) continue;
        mg.push({
          id: d.rateId,
          airport: d.airport,
          base: d.base != null && d.base !== ('' as unknown) ? Number(d.base) : null,
          includedPax: d.includedPax != null ? Number(d.includedPax) : 3,
          includedBags: d.includedPax != null ? Number(d.includedPax) : 3,
          extraPaxSurcharge: d.extraPaxSurcharge != null && d.extraPaxSurcharge !== ('' as unknown) ? Number(d.extraPaxSurcharge) : null,
        });
      }
      if (mg.length > 0) MEET_GREET_RATES.splice(0, MEET_GREET_RATES.length, ...mg);
    }
  } catch {
    /* repli statique silencieux */
  }
  bump();
}

/** À utiliser dans les composants qui lisent ROUTE_RATES/HOURLY_RATES pour se re-rendre après synchro. */
export function usePricingSync(): number {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => version,
  );
}
