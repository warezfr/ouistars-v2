/**
 * Notification interne d'une nouvelle commande ETG.
 * Envoie un e-mail à l'équipe ops via Resend si configuré ; sinon journalise.
 * Ne lève jamais d'exception (ne doit pas faire échouer /book).
 */
interface EtgOrderNotice {
  order_id: string;
  passengers: number;
  start_time: string;
  price_amount: number;
  price_currency: string;
  main_passenger: { first_name: string; last_name: string; phone_number: string; email?: string };
  supplier_link: string;
}

export async function notifyNewEtgOrder(order: EtgOrderNotice): Promise<void> {
  const passenger = `${order.main_passenger.first_name} ${order.main_passenger.last_name}`.trim();
  const summary = `Nouvelle commande ETG ${order.order_id} — ${passenger}, ${order.passengers} pax, ` +
    `${order.price_amount} ${order.price_currency}, départ ${order.start_time}`;

  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.OPS_NOTIFY_EMAIL ?? process.env.OPS_EMAIL;

  if (!resendKey || !to) {
    console.info('[ETG notify]', summary, '(e-mail non envoyé : RESEND_API_KEY/OPS_NOTIFY_EMAIL manquant)');
    return;
  }

  const html = `
    <h2>Nouvelle commande ETG</h2>
    <p><strong>Référence :</strong> ${order.order_id}</p>
    <p><strong>Passager :</strong> ${passenger} — ${order.main_passenger.phone_number}</p>
    <p><strong>Passagers :</strong> ${order.passengers}</p>
    <p><strong>Départ :</strong> ${order.start_time}</p>
    <p><strong>Montant :</strong> ${order.price_amount} ${order.price_currency}</p>
    <p><a href="${order.supplier_link}">Ouvrir la commande</a></p>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'Oui Stars <bookings@ouistars.com>',
        to: [to],
        subject: `Commande ETG ${order.order_id} — ${passenger}`,
        html,
      }),
    });
    if (!res.ok) {
      console.error('[ETG notify] échec envoi e-mail:', await res.text().catch(() => res.statusText));
    }
  } catch (err) {
    console.error('[ETG notify] erreur:', err);
  }
}
