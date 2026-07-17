import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPartnerApiKey } from './auth.js';
import { etgError, ERROR_CODES } from './errors.js';
import { ValidationError } from './pricing/engine.js';
import { logApiCall } from './repository.js';

type HandlerFn = (body: unknown) => Promise<unknown>;

/* ————— Limiteur de débit en mémoire (fenêtre glissante 1 min) ————— */
const RATE_LIMIT = Number(process.env.ETG_RATE_LIMIT ?? 120); // requêtes/min/IP
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function clientKey(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const ip = Array.isArray(fwd) ? fwd[0] : (fwd ?? '').split(',')[0].trim();
  return ip || req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // garde-fou mémoire
  return recent.length > RATE_LIMIT;
}

export function createEtgHandler(endpoint: string, handler: HandlerFn) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const start = Date.now();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      await logApiCall(endpoint, req.method ?? 'UNKNOWN', 405, Date.now() - start, 'Method not allowed');
      return res.status(405).json(etgError(ERROR_CODES.VALIDATION, 'Method not allowed'));
    }

    const isAuthenticated = await verifyPartnerApiKey(req.headers.authorization);
    if (!isAuthenticated) {
      await logApiCall(endpoint, 'POST', 401, Date.now() - start, 'Unauthorized');
      return res.status(401).json(etgError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized'));
    }

    if (isRateLimited(clientKey(req))) {
      res.setHeader('Retry-After', '60');
      await logApiCall(endpoint, 'POST', 429, Date.now() - start, 'Rate limited');
      return res.status(429).json(etgError(ERROR_CODES.VALIDATION, 'Too many requests'));
    }

    try {
      const result = await handler(req.body);
      await logApiCall(endpoint, 'POST', 200, Date.now() - start);
      return res.status(200).json(result);
    } catch (err) {
      if (err instanceof ValidationError) {
        await logApiCall(endpoint, 'POST', 400, Date.now() - start, err.message);
        return res.status(400).json(etgError(ERROR_CODES.VALIDATION, err.message));
      }
      console.error(`[ETG ${endpoint}]`, err);
      await logApiCall(endpoint, 'POST', 500, Date.now() - start, String(err));
      return res.status(500).json(etgError(ERROR_CODES.INTERNAL, 'Internal server error'));
    }
  };
}
