import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Client Supabase côté navigateur (clé anon).
 * Les écritures sensibles passent par les endpoints API (service role).
 */
export const supabase =
  url && anon ? createClient(url, anon) : null;

export const hasSupabase = Boolean(url && anon);
