import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient | null {
  const url = pickEnv(process.env, 'SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = pickEnv(process.env, 'SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  if (!serviceClient) serviceClient = createClient(url, key, { auth: { persistSession: false } });
  return serviceClient;
}

function pickEnv(env: NodeJS.ProcessEnv, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function getSupabaseProjectUrl(): string | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  return url?.replace(/\/$/, '') ?? null;
}
