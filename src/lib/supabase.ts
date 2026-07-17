import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase côté navigateur (clé anon).
 * La clé anon et l'URL sont publiques par conception (elles sont livrées dans
 * le bundle JS) — la sécurité repose sur la RLS. Les variables d'environnement
 * VITE_* priment sur les valeurs par défaut ci-dessous.
 * Les écritures sensibles passent par les endpoints API (service role, jamais committé).
 */
const DEFAULT_URL = 'https://iktxzxeqiqgdsfqwksik.supabase.co';
const DEFAULT_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdHh6eGVxaXFnZHNmcXdrc2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5Mzg4MzMsImV4cCI6MjA5OTUxNDgzM30.WQnyZvmSNuV7UMWakrTI4hNyT4MMu_VZvf6aTBdotE8';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL;
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_ANON;

export const supabase = url && anon ? createClient(url, anon) : null;

export const hasSupabase = Boolean(url && anon);
