import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from '../../server/etg/supabase.js';

/**
 * Suppression d'un utilisateur du back-office.
 * POST { userId }  + Authorization: Bearer <access_token admin>
 * Réservé aux admins actifs ; on ne peut pas se supprimer soi-même.
 * Supprime la ligne admin_profiles puis le compte Supabase Auth.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getServiceSupabase();
  if (!admin) return res.status(501).json({ error: 'Service non configuré (SUPABASE_SERVICE_ROLE_KEY manquant).' });

  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Non authentifié.' });

  const { data: caller, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller?.user) return res.status(401).json({ error: 'Session invalide.' });

  const { data: callerProfile } = await admin
    .from('admin_profiles').select('role, active').eq('id', caller.user.id).maybeSingle();
  if (!callerProfile?.active || callerProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Réservé aux administrateurs.' });
  }

  const userId = String(req.body?.userId ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return res.status(400).json({ error: 'Identifiant invalide.' });
  if (userId === caller.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });

  const { error: profileErr } = await admin.from('admin_profiles').delete().eq('id', userId);
  if (profileErr) return res.status(500).json({ error: `Profil : ${profileErr.message}` });

  // Supprime aussi le compte Auth (tolérant : le profil est déjà retiré).
  const { error: authErr } = await admin.auth.admin.deleteUser(userId);
  if (authErr && !/not.*found/i.test(authErr.message)) {
    return res.status(200).json({ ok: true, warning: `Profil retiré, compte Auth non supprimé : ${authErr.message}` });
  }

  return res.status(200).json({ ok: true });
}
