/**
 * Géocodage d'adresses réelles (type "saisie assistée Google") + distance routière.
 * - Autocomplétion : Photon (OpenStreetMap), biaisée France, sans clé API.
 * - Distance routière réelle : OSRM (profil driving), repli haversine × 1,3.
 * - Tarification intelligente : grille fixe si le trajet correspond à une zone connue
 *   (aéroports, gares, Paris, excursions…), sinon prix au kilomètre.
 * Tout s'exécute côté navigateur (aucune clé, aucune dépendance serveur).
 */
import { ROUTE_RATES, PER_KM_RATES, type VehicleClass } from '@/data/pricing';
import { LOCATIONS, ZONE_ROUTE_MAP, type PoiType } from '@/data/locations';
import { haversineKm } from '@/lib/estimate';

export interface Place {
  id: string;
  label: string;
  sub: string;
  lat: number;
  lng: number;
  type: PoiType;
  /** 'curated' pour nos POI prioritaires (aéroports…), 'osm' pour une adresse géocodée. */
  source?: 'curated' | 'osm';
}

/** Classe un résultat OSM en type d'icône. */
function osmType(p: Record<string, string | undefined>): PoiType {
  const k = `${p.osm_key ?? ''}:${p.osm_value ?? ''}`;
  if (k.includes('aerodrome') || k.includes('aeroway')) return 'airport';
  if (p.osm_key === 'railway' || (p.osm_value ?? '').includes('station')) return 'station';
  if (p.osm_key === 'place' && (p.osm_value === 'city' || p.osm_value === 'town' || p.osm_value === 'village')) return 'city';
  return 'landmark';
}

export type Prices = Record<VehicleClass, number>;

export interface OneWayEstimate {
  basis: 'fixed-route' | 'per-km';
  distanceKm: number;
  prices: Prices;
  routeLabel?: string;
  /** Id du trajet de la grille (transmis au serveur pour recalcul du prix). */
  routeId?: string;
}

const PARIS = { lat: 48.8566, lng: 2.3522 };

/** POI curatés prioritaires (aéroports, gares, grands sites) proposés en tête. */
const CURATED: Place[] = LOCATIONS.map((p) => ({
  id: `curated:${p.id}`,
  label: p.label,
  sub: p.sub,
  lat: p.lat,
  lng: p.lng,
  type: p.type,
  source: 'curated',
}));

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function curatedMatches(query: string): Place[] {
  const q = norm(query);
  if (!q) return CURATED.filter((_, i) => LOCATIONS[i].type === 'airport' || LOCATIONS[i].type === 'station').slice(0, 4);
  return CURATED.filter((p) => norm(`${p.label} ${p.sub}`).includes(q)).slice(0, 4);
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
}

function featureToPlace(f: PhotonFeature): Place | null {
  const [lng, lat] = f.geometry.coordinates;
  const p = f.properties;
  if (p.country && norm(p.country) !== 'france' && norm(p.country) !== 'monaco') return null;
  const line1 = [p.housenumber, p.street ?? p.name].filter(Boolean).join(' ') || p.name || p.city || '';
  const line2 = [p.postcode, p.city ?? p.county ?? p.state].filter(Boolean).join(' ');
  if (!line1) return null;
  return {
    id: `osm:${lat.toFixed(5)},${lng.toFixed(5)}`,
    label: line1,
    sub: line2 || p.state || 'France',
    lat,
    lng,
    type: osmType(p),
    source: 'osm',
  };
}

/** Recherche d'adresses : POI curatés + résultats OSM (Photon). */
export async function geocodeSearch(query: string, signal?: AbortSignal): Promise<Place[]> {
  const curated = curatedMatches(query);
  const q = query.trim();
  if (q.length < 3) return curated;

  try {
    const url =
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
      `&lang=fr&limit=6&lat=${PARIS.lat}&lon=${PARIS.lng}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return curated;
    const data = (await res.json()) as { features?: PhotonFeature[] };
    const osm = (data.features ?? [])
      .map(featureToPlace)
      .filter((p): p is Place => p !== null);
    // Dédoublonnage grossier avec les curatés (par proximité du label).
    const seen = new Set(curated.map((c) => norm(c.label)));
    const merged = [...curated];
    for (const p of osm) {
      if (seen.has(norm(p.label))) continue;
      seen.add(norm(p.label));
      merged.push(p);
    }
    return merged.slice(0, 8);
  } catch {
    return curated; // hors-ligne / bloqué → au moins les POI curatés
  }
}

/** Géocodage inverse : coordonnées → adresse (Photon reverse). */
export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<Place> {
  const fallback: Place = {
    id: `osm:${lat.toFixed(5)},${lng.toFixed(5)}`,
    label: 'Ma position',
    sub: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    lat, lng, type: 'landmark', source: 'osm',
  };
  try {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=fr`;
    const res = await fetch(url, { signal });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { features?: PhotonFeature[] };
    const f = data.features?.[0];
    if (!f) return fallback;
    const place = featureToPlace(f);
    // On garde les coordonnées GPS réelles (plus précises que le centroïde OSM).
    return place ? { ...place, lat, lng, id: fallback.id } : fallback;
  } catch {
    return fallback;
  }
}

/** Position de l'utilisateur (Geolocation API) → adresse. */
export function geolocate(signal?: AbortSignal): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(reverseGeocode(pos.coords.latitude, pos.coords.longitude, signal)),
      (err) => reject(new Error(
        err.code === err.PERMISSION_DENIED
          ? 'Localisation refusée — autorisez l’accès à votre position.'
          : 'Impossible d’obtenir votre position.',
      )),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

/** Détecte la zone tarifaire connue la plus proche d'un point (sinon null). */
function detectZone(pt: { lat: number; lng: number }): string | null {
  // rayon de rattachement par type de zone (km)
  const radiusFor = (zone: string): number => {
    if (zone === 'paris') return 12; // tout Paris + proche banlieue
    if (zone === 'paris-airport' || zone === 'beauvais' || zone === 'nice') return 7;
    if (zone === 'paris-station') return 3;
    return 8; // sites (Versailles, Disney, Monaco, villes…)
  };
  let best: { zone: string; d: number } | null = null;
  for (const loc of LOCATIONS) {
    const d = haversineKm(pt as never, loc);
    if (d <= radiusFor(loc.zone) && (!best || d < best.d)) best = { zone: loc.zone, d };
  }
  return best?.zone ?? null;
}

function fixedRoute(zoneA: string | null, zoneB: string | null) {
  if (!zoneA || !zoneB) return undefined;
  const rid = ZONE_ROUTE_MAP[`${zoneA}|${zoneB}`] ?? ZONE_ROUTE_MAP[`${zoneB}|${zoneA}`];
  return rid ? ROUTE_RATES.find((r) => r.id === rid) : undefined;
}

/** Distance routière réelle (OSRM), repli sur haversine × 1,3. */
export async function roadDistanceKm(a: Place, b: Place, signal?: AbortSignal): Promise<number> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`;
    const res = await fetch(url, { signal });
    if (res.ok) {
      const data = (await res.json()) as { routes?: { distance: number }[] };
      const m = data.routes?.[0]?.distance;
      if (typeof m === 'number' && m > 0) return Math.round(m / 1000);
    }
  } catch {
    /* repli ci-dessous */
  }
  return Math.max(1, Math.round(haversineKm(a as never, b as never) * 1.3));
}

/** Estimation One Way : grille fixe si zones connues, sinon prix au km (distance réelle). */
export async function estimatePlaces(from: Place, to: Place, signal?: AbortSignal): Promise<OneWayEstimate> {
  const route = fixedRoute(detectZone(from), detectZone(to));
  const distanceKm = await roadDistanceKm(from, to, signal);
  if (route) {
    return { basis: 'fixed-route', distanceKm, prices: { ...route.prices }, routeLabel: route.label, routeId: route.id };
  }
  const price = (rate: number) => Math.max(100, Math.round((distanceKm * rate) / 5) * 5);
  return {
    basis: 'per-km',
    distanceKm,
    prices: { E: price(PER_KM_RATES.E), V: price(PER_KM_RATES.V), S: price(PER_KM_RATES.S) },
  };
}
