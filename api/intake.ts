import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Capture des leads du site : booking | quote | chauffeur | newsletter.
 * Écrit dans Supabase (service role) et notifie l'équipe ops.
 * POST { type, channel, data | email }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body as { type?: string; channel?: string; data?: Record<string, string>; email?: string };
  if (!body?.type) return res.status(400).json({ error: 'type requis' });

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = url && key ? createClient(url, key) : null;

  const reference = `OS-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  try {
    if (supabase) {
      if (body.type === 'newsletter' && body.email) {
        await supabase.from('newsletter_subscribers').insert({ email: body.email.toLowerCase().trim(), status: 'active' });
      } else if (body.type === 'booking') {
        await supabase.from('website_bookings').insert({ reference, channel: body.channel ?? 'siteweb', ...body.data });
      } else if (body.type === 'quote') {
        await supabase.from('quotes').insert({ reference, channel: body.channel ?? 'siteweb', ...body.data });
      } else if (body.type === 'chauffeur') {
        await supabase.from('chauffeur_applications').insert({ reference, ...body.data });
      }
    }
    // TODO : notifier ops (Resend) — voir server/email.
    return res.status(200).json({ success: true, reference });
  } catch (e) {
    console.error('[intake]', e);
    return res.status(500).json({ error: 'Échec enregistrement' });
  }
}
