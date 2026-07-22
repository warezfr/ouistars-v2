import { supabase } from '@/lib/supabase';

/**
 * En-têtes JSON + jeton de session admin, pour les endpoints back-office
 * protégés par requireAdmin (documents, invitations, suppression…).
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
