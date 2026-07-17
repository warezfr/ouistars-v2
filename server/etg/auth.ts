import { createHash } from 'node:crypto';
import { getServiceSupabase } from './supabase.js';

/**
 * Authentification partenaire de l'API.
 * Schéma principal : Bearer token (`Authorization: Bearer os_live_…`), généré
 * depuis le back-office (Administration → Clés API). Seul le hash SHA-256 du
 * token est stocké en base (`etg_api_keys.token_hash`) — jamais le token clair.
 * Compat transitoire : Basic Auth (env ETG_BASIC_AUTH_*) reste accepté tant
 * que les variables existent, pour ne pas casser une intégration en cours.
 */
export async function verifyPartnerApiKey(authHeader: string | undefined): Promise<boolean> {
  if (!authHeader) return false;

  if (authHeader.startsWith('Bearer ')) {
    return verifyBearer(authHeader.slice(7).trim());
  }
  if (authHeader.startsWith('Basic ')) {
    return verifyBasic(authHeader.slice(6).trim()); // hérité — à retirer après migration des partenaires
  }
  return false;
}

export const hashToken = (token: string): string =>
  createHash('sha256').update(token, 'utf8').digest('hex');

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

  // Jeton statique d'environnement (secours / staging).
  const staticToken = process.env.ETG_BEARER_TOKEN;
  if (staticToken && safeEqual(token, staticToken)) return true;

  const supabase = getServiceSupabase();
  if (!supabase) return false;

  // Recherche par hash SHA-256 (stockage sécurisé), repli sur l'ancien champ clair.
  const digest = hashToken(token);
  let { data, error } = await supabase
    .from('etg_api_keys')
    .select('id, active')
    .eq('token_hash', digest)
    .maybeSingle();

  if ((error || !data) && token) {
    const legacy = await supabase
      .from('etg_api_keys')
      .select('id, active')
      .eq('token', token)
      .maybeSingle();
    data = legacy.data; error = legacy.error;
  }

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
