import { describe, it, expect, beforeAll } from 'vitest';
import { invoke } from '../helpers/vercel';
import handler from '../../api/intake';
import { ROUTE_RATES, MEET_GREET_RATES, HOURLY_RATES, HOURLY_MIN_HOURS } from '@/data/pricing';

/** Mode dégradé volontaire : pas de Supabase, pas de Resend →
    le handler doit fonctionner (validation, prix serveur, référence). */
beforeAll(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.RESEND_API_KEY;
  delete process.env.OPS_NOTIFY_EMAIL;
  delete process.env.OPS_EMAIL;
});

const ipHeader = (ip: string) => ({ 'x-forwarded-for': ip });

describe('POST /api/intake — plomberie HTTP', () => {
  it('OPTIONS → 200 (préflight CORS)', async () => {
    const r = await invoke(handler, { method: 'OPTIONS', headers: ipHeader('10.0.0.1') });
    expect(r.status).toBe(200);
    expect(r.headers['access-control-allow-origin']).toBe('*');
  });

  it('GET → 405', async () => {
    const r = await invoke(handler, { method: 'GET', headers: ipHeader('10.0.0.2') });
    expect(r.status).toBe(405);
  });

  it('type inconnu → 400', async () => {
    const r = await invoke(handler, {
      body: { type: 'piratage', data: {} }, headers: ipHeader('10.0.0.3'),
    });
    expect(r.status).toBe(400);
  });
});

describe('honeypot anti-bot', () => {
  it('champ « website » rempli → faux succès sans traitement', async () => {
    const r = await invoke(handler, {
      body: { type: 'booking', website: 'https://spam.example', data: { first_name: 'Bot' } },
      headers: ipHeader('10.0.0.4'),
    });
    expect(r.status).toBe(200);
    expect((r.body as { reference: string }).reference).toBe('OS-OK');
  });
});

describe('booking — prix officiel recalculé côté serveur', () => {
  const route = ROUTE_RATES.find((r) => r.id === 'paris-versailles') ?? ROUTE_RATES[0];

  it('route fixe : montant = grille (jamais celui du client)', async () => {
    const r = await invoke(handler, {
      body: {
        type: 'booking',
        amount: 1, // tentative de falsification côté client — doit être ignorée
        data: { first_name: 'Jean', last_name: 'Test', phone: '+33600000000', pickup: 'Paris', destination: 'Versailles' },
        pricing: { mode: 'oneway', routeId: route.id, vehicleClass: 'E' },
      },
      headers: ipHeader('10.0.1.1'),
    });
    expect(r.status).toBe(200);
    const body = r.body as { success: boolean; reference: string; amount: number };
    expect(body.success).toBe(true);
    expect(body.reference).toMatch(/^WEB-/);
    expect(body.amount).toBe(route.prices.E);
  });

  it('aller-retour = deux transferts → prix × 2', async () => {
    const r = await invoke(handler, {
      body: {
        type: 'booking',
        data: { first_name: 'Jean', last_name: 'Test', phone: '+33600000000', pickup: 'A', destination: 'B' },
        pricing: { mode: 'oneway', routeId: route.id, vehicleClass: 'S', roundTrip: true },
      },
      headers: ipHeader('10.0.1.2'),
    });
    expect((r.body as { amount: number }).amount).toBe(route.prices.S * 2);
  });

  it('horaire : plancher 3 h appliqué côté serveur', async () => {
    const r = await invoke(handler, {
      body: {
        type: 'booking',
        data: { first_name: 'J', last_name: 'T', phone: '+336', pickup: 'A', destination: 'B' },
        pricing: { mode: 'hourly', hours: 1, vehicleClass: 'V' },
      },
      headers: ipHeader('10.0.1.3'),
    });
    expect((r.body as { amount: number }).amount).toBe(HOURLY_MIN_HOURS * HOURLY_RATES.V);
  });

  it('au km : arrondi multiple de 5, plancher 100 €', async () => {
    const r = await invoke(handler, {
      body: {
        type: 'booking',
        data: { first_name: 'J', last_name: 'T', phone: '+336', pickup: 'A', destination: 'B' },
        pricing: { mode: 'oneway', distanceKm: 7, vehicleClass: 'E' }, // 7 × 3,5 = 24,5 → plancher 100
      },
      headers: ipHeader('10.0.1.4'),
    });
    expect((r.body as { amount: number }).amount).toBe(100);
  });

  it('routeId inconnu sans distance → amount null (sur devis)', async () => {
    const r = await invoke(handler, {
      body: {
        type: 'booking',
        data: { first_name: 'J', last_name: 'T', phone: '+336', pickup: 'A', destination: 'B' },
        pricing: { mode: 'oneway', routeId: 'route-fantome', vehicleClass: 'E' },
      },
      headers: ipHeader('10.0.1.5'),
    });
    expect(r.status).toBe(200);
    expect((r.body as { amount: number | null }).amount).toBeNull();
  });

  it('email invalide → 400 (Zod)', async () => {
    const r = await invoke(handler, {
      body: {
        type: 'booking',
        data: { first_name: 'J', last_name: 'T', phone: '+336', email: 'pas-un-email', pickup: 'A', destination: 'B' },
      },
      headers: ipHeader('10.0.1.6'),
    });
    expect(r.status).toBe(400);
  });

  it('champs hors liste blanche retirés silencieusement (.strip)', async () => {
    const r = await invoke(handler, {
      body: {
        type: 'booking',
        data: {
          first_name: 'J', last_name: 'T', phone: '+336', pickup: 'A', destination: 'B',
          role: 'admin', // tentative d'injection de colonne
        },
      },
      headers: ipHeader('10.0.1.7'),
    });
    expect(r.status).toBe(200);
  });

  it('passengers: 0 → 400', async () => {
    const r = await invoke(handler, {
      body: {
        type: 'booking',
        data: { first_name: 'J', last_name: 'T', phone: '+336', pickup: 'A', destination: 'B', passengers: 0 },
      },
      headers: ipHeader('10.0.1.8'),
    });
    expect(r.status).toBe(400);
  });
});

describe('greeter — tarif Meet & Greeter serveur', () => {
  const rate = MEET_GREET_RATES.find((r) => r.base != null)!;

  it('tarif officiel + supplément pax', async () => {
    const r = await invoke(handler, {
      body: {
        type: 'greeter',
        data: {
          service_type: 'arrival', airport_id: rate.id, airport_label: rate.airport,
          first_name: 'J', last_name: 'T', phone: '+336',
          passengers: rate.includedPax + 1,
        },
      },
      headers: ipHeader('10.0.2.1'),
    });
    expect(r.status).toBe(200);
    const body = r.body as { reference: string; amount: number };
    expect(body.reference).toMatch(/^GR-/);
    expect(body.amount).toBe(rate.base! + (rate.extraPaxSurcharge ?? 0));
  });

  it('service_type invalide → 400', async () => {
    const r = await invoke(handler, {
      body: { type: 'greeter', data: { service_type: 'teleportation', first_name: 'J', last_name: 'T', phone: '+336' } },
      headers: ipHeader('10.0.2.2'),
    });
    expect(r.status).toBe(400);
  });
});

describe('quote / chauffeur / newsletter', () => {
  it('quote valide → 200 + référence', async () => {
    const r = await invoke(handler, {
      body: { type: 'quote', data: { company: 'ACME', contact_name: 'Jean', email: 'j@acme.fr' } },
      headers: ipHeader('10.0.3.1'),
    });
    expect(r.status).toBe(200);
    expect((r.body as { reference: string }).reference).toMatch(/^WEB-/);
  });

  it('chauffeur valide → 200', async () => {
    const r = await invoke(handler, {
      body: { type: 'chauffeur', data: { first_name: 'Ali', last_name: 'D', phone: '+336', email: 'a@d.fr' } },
      headers: ipHeader('10.0.3.2'),
    });
    expect(r.status).toBe(200);
  });

  it('newsletter : email normalisé, invalide → 400', async () => {
    const ok = await invoke(handler, {
      body: { type: 'newsletter', email: 'Jean@Exemple.FR' }, headers: ipHeader('10.0.3.3'),
    });
    expect(ok.status).toBe(200);
    const ko = await invoke(handler, {
      body: { type: 'newsletter', email: 'rien' }, headers: ipHeader('10.0.3.4'),
    });
    expect(ko.status).toBe(400);
  });
});

describe('limite de débit (20 req/min/IP, fenêtre glissante)', () => {
  it('la 21e requête de la même IP → 429 ; une autre IP passe', async () => {
    const ip = '10.9.9.9';
    let last = 0;
    for (let i = 0; i < 21; i++) {
      const r = await invoke(handler, {
        body: { type: 'newsletter', email: `t${i}@ex.fr` }, headers: ipHeader(ip),
      });
      last = r.status;
      if (i < 20) expect(r.status).toBe(200);
    }
    expect(last).toBe(429);

    const other = await invoke(handler, {
      body: { type: 'newsletter', email: 'autre@ex.fr' }, headers: ipHeader('10.9.9.10'),
    });
    expect(other.status).toBe(200);
  });

  it('IP absente → « unknown », traitée sans crash', async () => {
    const r = await invoke(handler, { body: { type: 'newsletter', email: 'x@y.fr' } });
    expect([200, 429]).toContain(r.status); // « unknown » partage un seau : selon l'ordre des tests
  });
});
