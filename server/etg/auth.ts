import { getServiceSupabase } from './supabase.js';

/**
 * Authentification partenaire ETG.
 * ETG appelle nos webhooks en Basic Auth (login/mot de passe que nous leur
 * communiquons) — c'est le schéma déclaré dans openapi.yaml (`basicAuth`).
 * On accepte aussi un Bearer token adossé à la table `etg_api_keys`
 * (partenaires additionnels) lorsque Supabase est configuré.
 */
export async function verifyPartnerApiKey(authHeader: string | undefined): Promise<boolean> {
  if (!authHeader) return false;

  if (authHeader.startsWith('Basic ')) {
    return verifyBasic(authHeader.slice(6).trim());
  }
  if (authHeader.startsWith('Bearer ')) {
    return verifyBearer(authHeader.slice(7).trim());
  }
  return false;
}

/** Comparaison à temps quasi constant pour éviter les attaques temporelles. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function verifyBasic(encoded: string): boolean {
  const expectedUser = process.env.ETG_BASIC_AUTH_USER;
  const expectedPass = process.env.ETG_BASIC_AUTH_PASS;
  if (!expectedUser || !expectedPass) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return false;
  }
  const sep = decoded.indexOf(':');
  if (sep < 0) return false;
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);
  return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass);
}

async function verifyBearer(token: string): Promise<boolean> {
  if (!token) return false;

  // Jeton statique de repli (staging) si configuré.
  const staticToken = process.env.ETG_BEARER_TOKEN;
  if (staticToken && safeEqual(token, staticToken)) return true;

  const supabase = getServiceSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('etg_api_keys')
    .select('id, active')
    .eq('token', token)
    .maybeSingle();

  if (error || !data?.active) return false;

  // Mise à jour opportuniste de last_used_at (sans bloquer la réponse).
  void supabase.from('etg_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  return true;
}

/* ————— URLs publiques (liens fournisseur dans les réponses /book) ————— */
const DEFAULT_PUBLIC_SITE_URL = 'https://ouistars-v2.vercel.app';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function normalizeSiteOrigin(url: string | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  const withScheme = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  try {
    const host = new URL(withScheme).hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return null;
  } catch {
    return null;
  }
  return stripTrailingSlash(withScheme);
}

export function getPublicBaseUrl(): string {
  return (
    normalizeSiteOrigin(process.env.PUBLIC_SITE_URL) ??
    normalizeSiteOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeSiteOrigin(process.env.VERCEL_URL) ??
    DEFAULT_PUBLIC_SITE_URL
  );
}

export function getAdminBaseUrl(): string {
  if (process.env.ADMIN_BASE_URL) return stripTrailingSlash(process.env.ADMIN_BASE_URL);
  return `${getPublicBaseUrl()}/admin`;
}
