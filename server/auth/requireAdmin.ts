import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from '../etg/supabase.js';

/**
 * Garde d'authentification back-office pour les endpoints service_role.
 * Vérifie le JWT porté par l'appelant (Authorization: Bearer <access_token>)
 * et exige un profil admin_profiles actif. Retourne true si autorisé, sinon
 * répond lui-même (401/403/501) et retourne false.
 *
 * @param minWrite  si true, exige un rôle en écriture (admin | ops) ;
 *                  sinon un accès actif suffit (lecture).
 */
export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
  minWrite = true,
): Promise<boolean> {
  const admin = getServiceSupabase();
  if (!admin) {
    res.status(501).json({ error: 'Service non configuré (SUPABASE_SERVICE_ROLE_KEY manquant).' });
    return false;
  }

  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) { res.status(401).json({ error: 'Non authentifié.' }); return false; }

  const { data: caller, error } = await admin.auth.getUser(token);
  if (error || !caller?.user) { res.status(401).json({ error: 'Session invalide.' }); return false; }

  const { data: profile } = await admin
    .from('admin_profiles').select('role, active').eq('id', caller.user.id).maybeSingle();

  const active = Boolean(profile?.active);
  const canWrite = active && (profile?.role === 'admin' || profile?.role === 'ops');
  if (!active || (minWrite && !canWrite)) {
    res.status(403).json({ error: 'Accès réservé au back-office.' });
    return false;
  }
  return true;
}
