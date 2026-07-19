import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { invoke } from '../helpers/vercel';
import searchHandler from '../../api/search';
import bookHandler from '../../api/book';
import statusHandler from '../../api/status';
import cancelHandler from '../../api/cancel';
import { ROUTE_RATES } from '@/data/pricing';

/**
 * Cycle complet de l'API partenaire ETG sur le store mémoire (sans Supabase).
 * Le routage externe (Google/OSRM) est coupé → repli haversine déterministe.
 */
const TOKEN = 'os_live_test_etg';
const AUTH = { authorization: `Bearer ${TOKEN}`, 'x-forwarded-for': '10.20.0.1' };

const realFetch = globalThis.fetch;

beforeAll(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.ETG_BEARER_TOKEN = TOKEN;
  // Coupe tout appel réseau sortant (routage) → fallback haversine.
  globalThis.fetch = vi.fn().mockRejectedValue(new Error('réseau coupé en test')) as typeof fetch;
});
afterAll(() => {
  globalThis.fetch = realFetch;
  delete process.env.ETG_BEARER_TOKEN;
});

const FUTURE = '2030-06-15T10:00:00';
const CDG = { type: 'iata', iata: 'CDG' };
const PARIS_CENTER = { type: 'coordinates', latitude: 48.8566, longitude: 2.3522, address: 'Paris centre' };

describe('sécurité du périmètre ETG', () => {
  it('sans Authorization → 401', async () => {
    const r = await invoke(searchHandler, {
      body: { start_date_time: FUTURE, passengers: 2, start_point: CDG, end_point: PARIS_CENTER },
      headers: { 'x-forwarded-for': '10.20.0.2' },
    });
    expect(r.status).toBe(401);
  });

  it('Bearer invalide → 401', async () => {
    const r = await invoke(searchHandler, {
      body: { start_date_time: FUTURE, passengers: 2, start_point: CDG, end_point: PARIS_CENTER },
      headers: { authorization: 'Bearer os_live_faux', 'x-forwarded-for': '10.20.0.3' },
    });
    expect(r.status).toBe(401);
  });

  it('GET → 405 avec code erreur ETG', async () => {
    const r = await invoke(searchHandler, { method: 'GET', headers: AUTH });
    expect(r.status).toBe(405);
  });

  it('payload invalide (passengers: 0) → 400', async () => {
    const r = await invoke(searchHandler, {
      body: { start_date_time: FUTURE, passengers: 0, start_point: CDG, end_point: PARIS_CENTER },
      headers: AUTH,
    });
    expect(r.status).toBe(400);
  });

  it('date au passé → 200 avec zéro offre', async () => {
    const r = await invoke(searchHandler, {
      body: { start_date_time: '2020-01-01T10:00:00', passengers: 2, start_point: CDG, end_point: PARIS_CENTER },
      headers: AUTH,
    });
    expect(r.status).toBe(200);
    expect((r.body as { offers: unknown[] }).offers).toHaveLength(0);
  });
});

interface Offer {
  id: string; transfer_category: string; rate_card_id: string;
  price: { amount: number; currency: string };
}

describe('search → book → status → cancel (cycle complet)', () => {
  const grid = ROUTE_RATES.find((r) => r.id === 'cdg-ory-lbg-paris')!;
  let offers: Offer[] = [];
  let orderId = '';

  it('CDG → Paris : offres alignées sur la grille officielle', async () => {
    const r = await invoke(searchHandler, {
      body: { start_date_time: FUTURE, passengers: 2, start_point: CDG, end_point: PARIS_CENTER },
      headers: AUTH,
    });
    expect(r.status).toBe(200);
    offers = (r.body as { offers: Offer[] }).offers;
    expect(offers.length).toBeGreaterThan(0);

    const business = offers.find((o) => o.transfer_category === 'business');
    const van = offers.find((o) => o.transfer_category === 'business_van');
    const first = offers.find((o) => o.transfer_category === 'first');
    expect(business?.price.amount).toBe(grid.prices.E);
    expect(van?.price.amount).toBe(grid.prices.V);
    expect(first?.price.amount).toBe(grid.prices.S);
    expect(business?.price.currency).toBe('EUR');
  });

  it('sièges enfants : prix majoré du supplément', async () => {
    const r = await invoke(searchHandler, {
      body: {
        start_date_time: FUTURE, passengers: 2, children_seat_2: 1,
        start_point: CDG, end_point: PARIS_CENTER,
      },
      headers: AUTH,
    });
    const withSeat = (r.body as { offers: Offer[] }).offers.find((o) => o.transfer_category === 'business');
    expect(withSeat?.price.amount).toBe(grid.prices.E + 15); // child_seat_price: 15
  });

  it('book : réservation confirmée au prix de l’offre', async () => {
    const business = offers.find((o) => o.transfer_category === 'business')!;
    const r = await invoke(bookHandler, {
      body: {
        offer_id: business.id,
        start_point: CDG, end_point: PARIS_CENTER,
        passengers: 2, luggage_places: 2,
        main_passenger: { first_name: 'Jean', last_name: 'Client', phone_number: '+33600000000' },
        flight_number: 'AF1234',
      },
      headers: AUTH,
    });
    expect(r.status).toBe(200);
    const body = r.body as { order_id: string; status: string; price?: { amount: number } };
    expect(body.order_id).toBeTruthy();
    orderId = body.order_id;
  });

  it('status : commande active → « completed » (contrat binaire ETG)', async () => {
    const r = await invoke(statusHandler, { body: { order_id: orderId }, headers: AUTH });
    expect(r.status).toBe(200);
    expect((r.body as { status: string }).status).toBe('completed');
  });

  it('cancel : annulation gratuite avant l’échéance (pénalité 0), statut « cancelled »', async () => {
    const r = await invoke(cancelHandler, { body: { order_id: orderId }, headers: AUTH });
    expect(r.status).toBe(200);
    const body = r.body as { penalty: { amount: number } };
    expect(body.penalty.amount).toBe(0);

    const st = await invoke(statusHandler, { body: { order_id: orderId }, headers: AUTH });
    expect((st.body as { status: string }).status).toBe('cancelled');
  });

  it('book sur offre inexistante → 400', async () => {
    const r = await invoke(bookHandler, {
      body: {
        offer_id: 'offre-fantome',
        start_point: CDG, end_point: PARIS_CENTER,
        passengers: 1, luggage_places: 0,
        main_passenger: { first_name: 'J', last_name: 'T', phone_number: '+336' },
      },
      headers: AUTH,
    });
    expect(r.status).toBe(400);
  });

  it('status sur commande inconnue → 400', async () => {
    const r = await invoke(statusHandler, { body: { order_id: 'OS-INEXISTANT' }, headers: AUTH });
    expect(r.status).toBe(400);
  });

  it('numéro de vol invalide → 400', async () => {
    const business = offers.find((o) => o.transfer_category === 'business')!;
    const r = await invoke(bookHandler, {
      body: {
        offer_id: business.id,
        start_point: CDG, end_point: PARIS_CENTER,
        passengers: 1, luggage_places: 0,
        main_passenger: { first_name: 'J', last_name: 'T', phone_number: '+336' },
        flight_number: '!!invalid!!',
      },
      headers: AUTH,
    });
    expect(r.status).toBe(400);
  });

  it('capacité : 8 passagers → pas d’offre berline (sièges ≤ 7)', async () => {
    const r = await invoke(searchHandler, {
      body: { start_date_time: FUTURE, passengers: 8, start_point: CDG, end_point: PARIS_CENTER },
      headers: AUTH,
    });
    const cats = (r.body as { offers: Offer[] }).offers.map((o) => o.transfer_category);
    expect(cats).not.toContain('business');
    expect(cats).not.toContain('business_van');
  });
});
