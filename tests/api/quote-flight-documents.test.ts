import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { invoke } from '../helpers/vercel';
import quoteHandler from '../../api/pricing/quote';
import flightHandler from '../../api/flight';
import generateHandler from '../../api/documents/generate';
import { ROUTE_RATES, HOURLY_RATES, HOURLY_MIN_HOURS, PER_KM_RATES } from '@/data/pricing';

beforeAll(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

/* ————— /api/pricing/quote — contrat avec la grille ————— */
describe('POST /api/pricing/quote', () => {
  it('route fixe → prix grille + libellé', async () => {
    const route = ROUTE_RATES[0];
    const r = await invoke(quoteHandler, { body: { routeId: route.id, vehicleClass: 'S' } });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ amount: route.prices.S, basis: 'fixed-route', label: route.label });
  });

  it('horaire : plancher 3 h', async () => {
    const r = await invoke(quoteHandler, { body: { hours: 1, vehicleClass: 'V' } });
    expect(r.body).toMatchObject({ amount: HOURLY_MIN_HOURS * HOURLY_RATES.V, basis: 'hourly', hours: 3 });
  });

  it('au km : montant exact ×taux classe', async () => {
    const r = await invoke(quoteHandler, { body: { km: 42, vehicleClass: 'E' } });
    expect(r.body).toMatchObject({ amount: Math.round(42 * PER_KM_RATES.E * 100) / 100, basis: 'per-km' });
  });

  it('aucune base → 400 ; GET → 405', async () => {
    expect((await invoke(quoteHandler, { body: {} })).status).toBe(400);
    expect((await invoke(quoteHandler, { method: 'GET' })).status).toBe(405);
  });
});

/* ————— /api/flight — saisie assistée du numéro de vol ————— */
describe('GET /api/flight', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    delete process.env.AERODATABOX_API_KEY;
    delete process.env.AVIATIONSTACK_API_KEY;
  });

  it('sans clé fournisseur → enabled: false (dégradé propre)', async () => {
    const r = await invoke(flightHandler, {
      method: 'GET', query: { number: 'AF1234', date: '2030-06-15' },
      headers: { 'x-forwarded-for': '10.30.0.1' },
    });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ enabled: false, found: false, flights: [] });
  });

  it('numéro invalide → 400 ; date invalide → 400', async () => {
    process.env.AERODATABOX_API_KEY = 'k';
    const bad = await invoke(flightHandler, {
      method: 'GET', query: { number: '????', date: '2030-06-15' },
      headers: { 'x-forwarded-for': '10.30.0.2' },
    });
    expect(bad.status).toBe(400);
    const badDate = await invoke(flightHandler, {
      method: 'GET', query: { number: 'AF1234', date: '15/06/2030' },
      headers: { 'x-forwarded-for': '10.30.0.3' },
    });
    expect(badDate.status).toBe(400);
  });

  it('AeroDataBox (mock) : vol reconnu → détails normalisés + cache', async () => {
    process.env.AERODATABOX_API_KEY = 'k';
    const payload = [{
      number: 'AF 1234', status: 'Expected',
      airline: { name: 'Air France' },
      departure: { airport: { iata: 'CDG', municipalityName: 'Paris' }, scheduledTime: { local: '2030-06-15 09:35+02:00' } },
      arrival: { airport: { iata: 'NCE', municipalityName: 'Nice' }, scheduledTime: { local: '2030-06-15 11:05+02:00' } },
    }];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => payload });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const r = await invoke(flightHandler, {
      method: 'GET', query: { number: 'af 1234', date: '2030-06-15' },
      headers: { 'x-forwarded-for': '10.30.0.4' },
    });
    expect(r.status).toBe(200);
    const body = r.body as { found: boolean; flights: Array<{ airline: string; dep: { iata: string; time: string }; arr: { iata: string } }> };
    expect(body.found).toBe(true);
    expect(body.flights[0].airline).toBe('Air France');
    expect(body.flights[0].dep).toMatchObject({ iata: 'CDG', time: '09:35' });
    expect(body.flights[0].arr.iata).toBe('NCE');

    // 2e appel identique → servi par le cache (pas de nouvel appel réseau)
    await invoke(flightHandler, {
      method: 'GET', query: { number: 'AF1234', date: '2030-06-15' },
      headers: { 'x-forwarded-for': '10.30.0.5' },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fournisseur en panne (500) → 502 sans crash', async () => {
    process.env.AERODATABOX_API_KEY = 'k';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    const r = await invoke(flightHandler, {
      method: 'GET', query: { number: 'LH999', date: '2030-06-15' },
      headers: { 'x-forwarded-for': '10.30.0.6' },
    });
    expect(r.status).toBe(502);
  });

  it('vol introuvable (404 fournisseur) → found: false', async () => {
    process.env.AERODATABOX_API_KEY = 'k';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
    const r = await invoke(flightHandler, {
      method: 'GET', query: { number: 'XX1', date: '2030-06-15' },
      headers: { 'x-forwarded-for': '10.30.0.7' },
    });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ enabled: true, found: false });
  });
});

/* ————— /api/documents/generate — PDF réels ————— */
describe('POST /api/documents/generate', () => {
  const realFetch = globalThis.fetch;
  beforeAll(() => {
    // fetchLogo coupé → PDF sans logo, zéro réseau.
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
  });
  afterAll(() => { globalThis.fetch = realFetch; });

  const isPdf = (b: unknown) => Buffer.isBuffer(b) && b.subarray(0, 4).toString() === '%PDF';

  it('facture : PDF valide non vide (données démo sans base)', async () => {
    const r = await invoke(generateHandler, { body: { reference: 'OS-TEST1', type: 'invoice' } });
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toBe('application/pdf');
    expect(isPdf(r.body)).toBe(true);
    expect((r.body as Buffer).length).toBeGreaterThan(1000);
  });

  it('fiche mission / bon de commande / devis : PDF valides', async () => {
    for (const type of ['mission_sheet', 'purchase_order', 'quote']) {
      const r = await invoke(generateHandler, { body: { reference: 'OS-TEST2', type } });
      expect(r.status, type).toBe(200);
      expect(isPdf(r.body), type).toBe(true);
    }
  });
});
