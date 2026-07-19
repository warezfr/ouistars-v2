import type { Page } from '@playwright/test';

/** Interception de TOUT le réseau externe — suite déterministe. */

export interface StubOptions {
  /** Lignes cms_entries « route » renvoyées par Supabase (pipeline prix). */
  cmsRoutes?: Array<{ data: Record<string, unknown>; position: number }>;
  /** Singleton « rates » renvoyé par Supabase. */
  cmsRates?: Record<string, number> | null;
}

export const PHOTON_PLACES = {
  cdg: {
    geometry: { coordinates: [2.5479, 49.0097] },
    properties: { osm_id: 1, name: 'Aéroport Charles de Gaulle', city: 'Roissy-en-France', osm_value: 'aerodrome', countrycode: 'FR' },
  },
  paris: {
    geometry: { coordinates: [2.304, 48.8718] },
    properties: { osm_id: 2, name: 'Avenue des Champs-Élysées', city: 'Paris', osm_value: 'residential', countrycode: 'FR' },
  },
};

export async function installStubs(page: Page, opts: StubOptions = {}) {
  // Géocodage Photon : « cdg » → aéroport, sinon → Champs-Élysées.
  await page.route('**/photon.komoot.io/**', (route) => {
    const url = route.request().url();
    const q = decodeURIComponent(/[?&]q=([^&]*)/.exec(url)?.[1] ?? '').toLowerCase();
    const feature = q.includes('cdg') || q.includes('gaulle') ? PHOTON_PLACES.cdg : PHOTON_PLACES.paris;
    return route.fulfill({ json: { features: [feature] } });
  });

  // Routage OSRM : 29 km / 35 min constants.
  await page.route('**/router.project-osrm.org/**', (route) =>
    route.fulfill({ json: { code: 'Ok', routes: [{ distance: 29_000, duration: 2100 }] } }),
  );

  // Supabase REST (CMS) — ATTENTION à l'ordre : Playwright évalue la DERNIÈRE
  // route enregistrée en premier → le générique s'enregistre AVANT les spécifiques.
  await page.route('**/auth/v1/**', (route) => route.fulfill({ json: {} }));
  await page.route('**/rest/v1/**', (route) => route.fulfill({ json: [] }));
  await page.route('**/rest/v1/cms_singletons**', (route) => {
    const url = route.request().url();
    // maybeSingle → PostgREST renvoie un OBJET (ou null), jamais un tableau.
    if (url.includes('key=eq.rates') && opts.cmsRates) {
      return route.fulfill({ json: { data: opts.cmsRates } });
    }
    return route.fulfill({ body: 'null', contentType: 'application/json' });
  });
  await page.route('**/rest/v1/cms_entries**', (route) => {
    const url = route.request().url();
    const isRoutes = url.includes('collection=eq.route');
    return route.fulfill({ json: isRoutes ? (opts.cmsRoutes ?? []) : [] });
  });

  // APIs internes (absentes de vite preview) : succès simulés.
  await page.route('**/api/intake', (route) =>
    route.fulfill({ json: { success: true, reference: 'WEB-E2E01', amount: 120 } }),
  );
  await page.route('**/api/flight**', (route) =>
    route.fulfill({ json: { enabled: false, found: false, flights: [] } }),
  );

  // Polices Google : on laisse passer (mise en page) mais sans bloquer si offline.
  await page.route('**/fonts.gstatic.com/**', (route) => route.continue().catch(() => route.abort()));
}

/** Petit utilitaire : capture les corps envoyés à /api/intake. */
export async function captureIntake(page: Page): Promise<{ bodies: Array<Record<string, unknown>> }> {
  const captured = { bodies: [] as Array<Record<string, unknown>> };
  await page.route('**/api/intake', (route) => {
    try { captured.bodies.push(JSON.parse(route.request().postData() ?? '{}')); } catch { /* noop */ }
    return route.fulfill({ json: { success: true, reference: 'WEB-E2E02', amount: 120 } });
  });
  return captured;
}
