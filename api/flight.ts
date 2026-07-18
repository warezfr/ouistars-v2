import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Identification d'un vol par numéro + date (saisie assistée du wizard
 * Meet & Greeter). Fournisseurs supportés (selon la clé configurée) :
 *   - AERODATABOX_API_KEY   → AeroDataBox via RapidAPI
 *   - AVIATIONSTACK_API_KEY → aviationstack
 * Sans clé : { enabled: false } — le client se limite à la reconnaissance
 * de la compagnie (référentiel local).
 * Réponse : { enabled, found, flights: [{ number, airline, status,
 *   dep: { iata, airport, time }, arr: { iata, airport, time } }] }
 */

interface Leg {
  number: string;
  airline: string;
  status: string;
  dep: { iata: string; airport: string; time: string };
  arr: { iata: string; airport: string; time: string };
}

/* Cache mémoire 10 min + limite de débit 30/min/IP */
const cache = new Map<string, { at: number; legs: Leg[] }>();
const TTL = 10 * 60_000;
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const rec = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  rec.push(now);
  hits.set(ip, rec);
  if (hits.size > 5000) hits.clear();
  return rec.length > 30;
}

const hhmm = (s: unknown): string => {
  const str = String(s ?? '');
  const m = /(\d{2}):(\d{2})/.exec(str.slice(10));
  return m ? `${m[1]}:${m[2]}` : '';
};

async function fromAeroDataBox(key: string, num: string, date: string): Promise<Leg[] | null> {
  const r = await fetch(
    `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(num)}/${date}?dateLocalRole=Both`,
    { headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com' } },
  );
  if (r.status === 404) return [];
  if (!r.ok) return null;
  const json = (await r.json()) as Array<Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!Array.isArray(json)) return [];
  return json.map((f) => ({
    number: String(f.number ?? num),
    airline: String(f.airline?.name ?? ''),
    status: String(f.status ?? ''),
    dep: {
      iata: String(f.departure?.airport?.iata ?? ''),
      airport: String(f.departure?.airport?.municipalityName ?? f.departure?.airport?.name ?? ''),
      time: hhmm(f.departure?.scheduledTime?.local ?? f.departure?.scheduledTimeLocal),
    },
    arr: {
      iata: String(f.arrival?.airport?.iata ?? ''),
      airport: String(f.arrival?.airport?.municipalityName ?? f.arrival?.airport?.name ?? ''),
      time: hhmm(f.arrival?.scheduledTime?.local ?? f.arrival?.scheduledTimeLocal),
    },
  }));
}

async function fromAviationstack(key: string, num: string, date: string): Promise<Leg[] | null> {
  const r = await fetch(
    `https://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(key)}&flight_iata=${encodeURIComponent(num)}&flight_date=${date}`,
  );
  if (!r.ok) return null;
  const json = (await r.json()) as { data?: Array<Record<string, any>> }; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!Array.isArray(json.data)) return [];
  return json.data.map((f) => ({
    number: String(f.flight?.iata ?? num),
    airline: String(f.airline?.name ?? ''),
    status: String(f.flight_status ?? ''),
    dep: {
      iata: String(f.departure?.iata ?? ''),
      airport: String(f.departure?.airport ?? ''),
      time: hhmm(f.departure?.scheduled),
    },
    arr: {
      iata: String(f.arrival?.iata ?? ''),
      airport: String(f.arrival?.airport ?? ''),
      time: hhmm(f.arrival?.scheduled),
    },
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const adbKey = process.env.AERODATABOX_API_KEY;
  const avsKey = process.env.AVIATIONSTACK_API_KEY;
  if (!adbKey && !avsKey) return res.status(200).json({ enabled: false, found: false, flights: [] });

  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : (fwd ?? '')).split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Trop de requêtes' });

  const raw = String(req.query.number ?? '').toUpperCase().replace(/[\s.-]/g, '');
  const date = String(req.query.date ?? '');
  if (!/^([A-Z][A-Z0-9]|[0-9][A-Z])\d{1,4}[A-Z]?$/.test(raw)) {
    return res.status(400).json({ error: 'Numéro de vol invalide' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Date invalide' });
  }

  const cacheKey = `${raw}:${date}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) {
    return res.status(200).json({ enabled: true, found: hit.legs.length > 0, flights: hit.legs });
  }

  try {
    let legs: Leg[] | null = null;
    if (adbKey) legs = await fromAeroDataBox(adbKey, raw, date);
    if (legs == null && avsKey) legs = await fromAviationstack(avsKey, raw, date);
    if (legs == null) return res.status(502).json({ error: 'Fournisseur indisponible' });

    legs = legs.filter((l) => l.dep.iata || l.arr.iata).slice(0, 4);
    cache.set(cacheKey, { at: Date.now(), legs });
    if (cache.size > 2000) cache.clear();
    return res.status(200).json({ enabled: true, found: legs.length > 0, flights: legs });
  } catch (e) {
    console.error('[flight]', e);
    return res.status(502).json({ error: 'Échec identification vol' });
  }
}
