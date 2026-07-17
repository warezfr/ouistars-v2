import type { GeoPoint, AirportMapping, CoverageZone } from '../types.js';

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateDurationMinutes(distanceKm: number): number {
  const avgSpeedKmh = 45;
  return Math.max(15, Math.round((distanceKm / avgSpeedKmh) * 60));
}

export function resolveCoords(
  point: GeoPoint,
  airports: AirportMapping[],
  zones: CoverageZone[],
): { lat: number; lng: number; timezone: string; matchType: 'iata' | 'coords' | 'zone'; matchValue: string } | null {
  if (point.type === 'iata' && point.iata) {
    const airport = airports.find(a => a.iata_code === point.iata!.toUpperCase());
    if (!airport) return null;
    return {
      lat: airport.latitude,
      lng: airport.longitude,
      timezone: airport.timezone,
      matchType: 'iata',
      matchValue: airport.iata_code,
    };
  }

  if (point.type === 'coordinates' && point.latitude != null && point.longitude != null) {
    const zone = findZone(point.latitude, point.longitude, zones);
    const coordsKey = `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
    for (const cardCoords of KNOWN_COORDS) {
      if (haversineKm(point.latitude, point.longitude, cardCoords.lat, cardCoords.lng) < 2) {
        return {
          lat: point.latitude,
          lng: point.longitude,
          timezone: zone?.timezone ?? 'Europe/Paris',
          matchType: 'coords',
          matchValue: `${cardCoords.lat},${cardCoords.lng}`,
        };
      }
    }
    return {
      lat: point.latitude,
      lng: point.longitude,
      timezone: zone?.timezone ?? 'Europe/Paris',
      matchType: 'coords',
      matchValue: coordsKey,
    };
  }

  return null;
}

const KNOWN_COORDS = [
  { lat: 48.8809, lng: 2.3553, key: '48.8809,2.3553' },
  { lat: 48.8049, lng: 2.1204, key: '48.8049,2.1204' },
  { lat: 43.7384, lng: 7.4246, key: '43.7384,7.4246' },
  { lat: 43.5528, lng: 7.0174, key: '43.5528,7.0174' },
];

export function findZone(lat: number, lng: number, zones: CoverageZone[]): CoverageZone | null {
  for (const zone of zones) {
    const dist = haversineKm(lat, lng, zone.center_lat, zone.center_lng);
    if (dist <= zone.radius_km) return zone;
  }
  return null;
}

export function isInZone(lat: number, lng: number, zoneId: string, zones: CoverageZone[]): boolean {
  const zone = zones.find(z => z.id === zoneId);
  if (!zone) return false;
  return haversineKm(lat, lng, zone.center_lat, zone.center_lng) <= zone.radius_km;
}

/** ETG rule: return same local time with correct timezone offset */
export function formatStartDateTimeWithTimezone(isoZ: string, timezone: string): string {
  const match = isoZ.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
  const localPart = match?.[1] ?? isoZ.replace('Z', '').slice(0, 19);
  const offset = getTimezoneOffset(timezone, localPart);
  return `${localPart}${offset}`;
}

function getTimezoneOffset(timezone: string, localDateTime: string): string {
  try {
    const ref = new Date(`${localDateTime}Z`);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(ref);
    const tzPart = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+1';
    const m = tzPart.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
    if (m) {
      const hours = m[1].padStart(3, m[1].startsWith('-') ? '-' : '+');
      const mins = m[2] ?? '00';
      return `${hours.includes(':') ? hours : `${hours[0]}${hours.slice(1).padStart(2, '0')}`}:${mins}`;
    }
  } catch {
    /* fallback */
  }
  return '+01:00';
}

export function parsePickupTime(iso: string): Date {
  return new Date(iso.endsWith('Z') ? iso : `${iso}`);
}

export function hoursUntilPickup(pickupIso: string): number {
  const pickup = parsePickupTime(pickupIso);
  return (pickup.getTime() - Date.now()) / (1000 * 60 * 60);
}

export function computeFreeCancelUntil(pickupIso: string, freeCancelHours: number, timezone: string): string {
  const pickup = parsePickupTime(pickupIso);
  const cancel = new Date(pickup.getTime() - freeCancelHours * 60 * 60 * 1000);
  const iso = cancel.toISOString().replace(/\.\d{3}Z$/, '');
  return formatStartDateTimeWithTimezone(`${iso}Z`, timezone);
}

export interface RoutingResult {
  distance_meters: number;
  duration_minutes: number;
}

export async function getRouteDistance(
  startLat: number, startLng: number,
  endLat: number, endLng: number,
): Promise<RoutingResult | null> {
  // Option A: Google Maps Routes API (Highly Recommended)
  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: startLat, longitude: startLng } } },
          destination: { location: { latLng: { latitude: endLat, longitude: endLng } } },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
        }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json() as any;
        if (data.routes?.[0]) {
          return {
            distance_meters: data.routes[0].distanceMeters,
            duration_minutes: Math.round(parseInt(data.routes[0].duration.replace('s', ''), 10) / 60),
          };
        }
      }
    } catch {
      // Fallback below
    }
  }

  // Option B: Private OSRM or Public Fallback
  const baseUrl = process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org';
  const url = `${baseUrl}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    return {
      distance_meters: Math.round(data.routes[0].distance),
      duration_minutes: Math.round(data.routes[0].duration / 60),
    };
  } catch {
    return null; // Fallback to Haversine
  }
}

