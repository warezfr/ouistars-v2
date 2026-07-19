import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ROUTE_RATES, HOURLY_RATES } from '@/data/pricing';

/** server/pricing/live.ts — repli statique, cache 60 s, fusion partielle. */

const supabaseMock = vi.hoisted(() => ({
  createClient: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => supabaseMock);

function fakeDb(tables: {
  routes?: unknown[]; rates?: Record<string, number> | null; greeter?: unknown[];
}) {
  const from = (table: string) => {
    const chain: Record<string, unknown> = {};
    const resolveRoutes = { data: tables.routes ?? [], error: null };
    const resolveGreeter = { data: tables.greeter ?? [], error: null };
    let collection = '';
    chain.select = () => chain;
    chain.eq = (col: string, val: string) => {
      if (col === 'collection') collection = val;
      return chain;
    };
    chain.order = () => Promise.resolve(collection === 'route' ? resolveRoutes : resolveGreeter);
    chain.maybeSingle = () =>
      Promise.resolve({ data: tables.rates ? { data: tables.rates } : null, error: null });
    void table;
    return chain;
  };
  return { from };
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  supabaseMock.createClient.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

async function freshGetLivePricing() {
  const mod = await import('../../server/pricing/live');
  return mod.getLivePricing;
}

describe('getLivePricing', () => {
  it('sans variables d’environnement → grille statique intégrale', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const getLivePricing = await freshGetLivePricing();
    const live = await getLivePricing();
    expect(live.routes).toStrictEqual(ROUTE_RATES);
    expect(live.hourly).toEqual(HOURLY_RATES);
    expect(supabaseMock.createClient).not.toHaveBeenCalled();
  });

  it('Supabase en erreur réseau → repli statique silencieux', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    supabaseMock.createClient.mockImplementation(() => { throw new Error('réseau HS'); });
    const getLivePricing = await freshGetLivePricing();
    const live = await getLivePricing();
    expect(live.routes).toStrictEqual(ROUTE_RATES);
  });

  it('routes publiées en DB → remplacent la grille ; taux partiels fusionnés', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    supabaseMock.createClient.mockReturnValue(fakeDb({
      routes: [
        { data: { routeId: 'paris-versailles', label: 'Paris ⇄ Versailles', category: 'tour', priceE: 115, priceV: 125, priceS: 195 }, position: 1 },
      ],
      rates: { hourlyE: 85 }, // seul E modifié — V/S doivent garder le statique
    }));
    const getLivePricing = await freshGetLivePricing();
    const live = await getLivePricing();
    expect(live.routes).toHaveLength(1);
    expect(live.routes[0].prices).toEqual({ E: 115, V: 125, S: 195 });
    expect(live.hourly.E).toBe(85);
    expect(live.hourly.V).toBe(HOURLY_RATES.V);
    expect(live.hourly.S).toBe(HOURLY_RATES.S);
  });

  it('entrée DB incomplète (prix manquant) → ignorée, repli statique', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    supabaseMock.createClient.mockReturnValue(fakeDb({
      routes: [{ data: { routeId: 'x', label: 'X', priceE: 100 }, position: 1 }], // priceV/S absents
    }));
    const getLivePricing = await freshGetLivePricing();
    const live = await getLivePricing();
    expect(live.routes).toStrictEqual(ROUTE_RATES);
  });

  it('cache 60 s : deux appels rapprochés → une seule création de client', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    supabaseMock.createClient.mockReturnValue(fakeDb({
      routes: [{ data: { routeId: 'r1', label: 'R1', priceE: 1, priceV: 2, priceS: 3 }, position: 1 }],
    }));
    const getLivePricing = await freshGetLivePricing();
    await getLivePricing();
    await getLivePricing();
    expect(supabaseMock.createClient).toHaveBeenCalledTimes(1);
  });
});
