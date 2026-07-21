import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from '../../server/etg/supabase.js';

/**
 * Invitation d'un nouvel utilisateur du back-office.
 * POST { email, role, displayName? }  + Authorization: Bearer <access_token admin>
 *
 * Flux :
 *   1. Vérifie que l'appelant est un admin actif (via son JWT).
 *   2. Crée l'utilisateur Supabase et lui envoie l'e-mail d'invitation
 *      (lien pour définir son mot de passe → /admin/reset).
 *   3. Crée sa ligne admin_profiles (rôle, actif) — plus besoin de coller un UID.
 *
 * Nécessite SUPABASE_SERVICE_ROLE_KEY côté serveur.
 */
const ROLES = new Set(['admin', 'ops', 'readonly']);

function siteBase(req: VercelRequest): string {
  const env = process.env.PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  const host = req.headers.host ?? 'www.ouistars.com';
  return `${proto}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = getServiceSupabase();
  if (!admin) return res.status(501).json({ error: 'Service non configuré (SUPABASE_SERVICE_ROLE_KEY manquant).' });

  // 1. Authentifier l'appelant via son access token.
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Non authentifié.' });

  const { data: caller, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller?.user) return res.status(401).json({ error: 'Session invalide.' });

  const { data: callerProfile } = await admin
    .from('admin_profiles')
    .select('role, active')
    .eq('id', caller.user.id)
    .maybeSingle();
  if (!callerProfile?.active || callerProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Réservé aux administrateurs.' });
  }

  // 2. Valider l'entrée.
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const role = String(req.body?.role ?? 'ops');
  const displayName = req.body?.displayName ? String(req.body.displayName).trim() : null;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'E-mail invalide.' });
  }
  if (!ROLES.has(role)) return res.status(400).json({ error: 'Rôle invalide.' });

  // 3. Inviter l'utilisateur (crée le compte + envoie l'e-mail avec le lien).
  const redirectTo = `${siteBase(req)}/admin/reset`;
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });

  let userId = invited?.user?.id;

  if (inviteErr) {
    // L'utilisateur existe déjà : on le retrouve et on (re)crée juste son profil.
    const alreadyExists = /already|exist|registered/i.test(inviteErr.message);
    if (!alreadyExists) return res.status(502).json({ error: `Invitation impossible : ${inviteErr.message}` });
    const { data: list } = await admin.auth.admin.listUsers();
    const users = (list?.users ?? []) as Array<{ id: string; email?: string }>;
    userId = users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (!userId) return res.status(409).json({ error: 'Utilisateur déjà existant mais introuvable.' });
  }

  // 4. Créer / mettre à jour la ligne admin_profiles.
  const { error: profileErr } = await admin.from('admin_profiles').upsert(
    { id: userId, email, role, active: true, display_name: displayName },
    { onConflict: 'id' },
  );
  if (profileErr) return res.status(500).json({ error: `Profil non créé : ${profileErr.message}` });

  return res.status(200).json({
    ok: true,
    userId,
    invited: !inviteErr,
    message: inviteErr
      ? 'Utilisateur déjà inscrit — profil mis à jour (aucun e-mail renvoyé).'
      : 'Invitation envoyée par e-mail.',
  });
}
