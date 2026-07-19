import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** server/etg/auth.ts — Bearer (statique + DB hashée), Basic hérité, hashToken. */

const dbMock = vi.hoisted(() => ({ getServiceSupabase: vi.fn() }));
vi.mock('../../server/etg/supabase', () => ({
  getServiceSupabase: dbMock.getServiceSupabase,
  getSupabaseProjectUrl: () => null,
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  dbMock.getServiceSupabase.mockReset();
  dbMock.getServiceSupabase.mockReturnValue(null);
});
afterEach(() => vi.unstubAllEnvs());

async function auth() {
  return import('../../server/etg/auth');
}

describe('hashToken', () => {
  it('SHA-256 hexadécimal stable', async () => {
    const { hashToken } = await auth();
    expect(hashToken('os_live_abc')).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken('os_live_abc')).toBe(hashToken('os_live_abc'));
    expect(hashToken('os_live_abc')).not.toBe(hashToken('os_live_abd'));
  });
});

describe('verifyPartnerApiKey — formes d’en-tête', () => {
  it('en-tête absent → refus', async () => {
    const { verifyPartnerApiKey } = await auth();
    expect(await verifyPartnerApiKey(undefined)).toBe(false);
  });

  it('schéma inconnu → refus', async () => {
    const { verifyPartnerApiKey } = await auth();
    expect(await verifyPartnerApiKey('Token abc')).toBe(false);
    expect(await verifyPartnerApiKey('os_live_abc')).toBe(false);
  });

  it('Bearer vide → refus', async () => {
    const { verifyPartnerApiKey } = await auth();
    expect(await verifyPartnerApiKey('Bearer ')).toBe(false);
  });
});

describe('Bearer statique (env ETG_BEARER_TOKEN)', () => {
  it('jeton exact → accepté', async () => {
    vi.stubEnv('ETG_BEARER_TOKEN', 'os_live_static_123');
    const { verifyPartnerApiKey } = await auth();
    expect(await verifyPartnerApiKey('Bearer os_live_static_123')).toBe(true);
  });

  it('jeton différent, pas de DB → refus', async () => {
    vi.stubEnv('ETG_BEARER_TOKEN', 'os_live_static_123');
    const { verifyPartnerApiKey } = await auth();
    expect(await verifyPartnerApiKey('Bearer os_live_autre')).toBe(false);
  });

  it('même longueur mais contenu différent → refus (safeEqual)', async () => {
    vi.stubEnv('ETG_BEARER_TOKEN', 'aaaaaaaa');
    const { verifyPartnerApiKey } = await auth();
    expect(await verifyPartnerApiKey('Bearer aaaaaaab')).toBe(false);
  });
});

describe('Bearer via DB (hash SHA-256)', () => {
  function fakeKeyDb(rows: { token_hash?: string; token?: string; active: boolean }[]) {
    return {
      from: () => ({
        select: () => ({
          eq: (col: string, val: string) => ({
            maybeSingle: () => {
              const hit = rows.find((r) => (col === 'token_hash' ? r.token_hash === val : r.token === val));
              return Promise.resolve({ data: hit ? { id: 'k1', active: hit.active } : null, error: null });
            },
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    };
  }

  it('clé active retrouvée par hash → acceptée', async () => {
    const { verifyPartnerApiKey, hashToken } = await auth();
    dbMock.getServiceSupabase.mockReturnValue(fakeKeyDb([
      { token_hash: hashToken('os_live_db_key'), active: true },
    ]));
    expect(await verifyPartnerApiKey('Bearer os_live_db_key')).toBe(true);
  });

  it('clé révoquée (active=false) → refus', async () => {
    const { verifyPartnerApiKey, hashToken } = await auth();
    dbMock.getServiceSupabase.mockReturnValue(fakeKeyDb([
      { token_hash: hashToken('os_live_revoked'), active: false },
    ]));
    expect(await verifyPartnerApiKey('Bearer os_live_revoked')).toBe(false);
  });

  it('clé inconnue → refus', async () => {
    const { verifyPartnerApiKey } = await auth();
    dbMock.getServiceSupabase.mockReturnValue(fakeKeyDb([]));
    expect(await verifyPartnerApiKey('Bearer os_live_inconnue')).toBe(false);
  });

  it('repli hérité : clé stockée en clair (colonne token) → acceptée', async () => {
    const { verifyPartnerApiKey } = await auth();
    dbMock.getServiceSupabase.mockReturnValue(fakeKeyDb([
      { token: 'os_live_legacy', active: true },
    ]));
    expect(await verifyPartnerApiKey('Bearer os_live_legacy')).toBe(true);
  });
});

describe('Basic Auth héritée (à retirer après migration partenaires)', () => {
  it('identifiants exacts → acceptés tant que les env existent', async () => {
    vi.stubEnv('ETG_BASIC_AUTH_USER', 'ouistars');
    vi.stubEnv('ETG_BASIC_AUTH_PASS', 's3cret');
    const { verifyPartnerApiKey } = await auth();
    const encoded = Buffer.from('ouistars:s3cret').toString('base64');
    expect(await verifyPartnerApiKey(`Basic ${encoded}`)).toBe(true);
  });

  it('mauvais mot de passe → refus', async () => {
    vi.stubEnv('ETG_BASIC_AUTH_USER', 'ouistars');
    vi.stubEnv('ETG_BASIC_AUTH_PASS', 's3cret');
    const { verifyPartnerApiKey } = await auth();
    const encoded = Buffer.from('ouistars:wrong1').toString('base64');
    expect(await verifyPartnerApiKey(`Basic ${encoded}`)).toBe(false);
  });

  it('env absentes → Basic refusé (chemin de retrait)', async () => {
    const { verifyPartnerApiKey } = await auth();
    const encoded = Buffer.from('ouistars:s3cret').toString('base64');
    expect(await verifyPartnerApiKey(`Basic ${encoded}`)).toBe(false);
  });

  it('base64 sans séparateur « : » → refus', async () => {
    vi.stubEnv('ETG_BASIC_AUTH_USER', 'ouistars');
    vi.stubEnv('ETG_BASIC_AUTH_PASS', 's3cret');
    const { verifyPartnerApiKey } = await auth();
    expect(await verifyPartnerApiKey(`Basic ${Buffer.from('sans-separateur').toString('base64')}`)).toBe(false);
  });
});
