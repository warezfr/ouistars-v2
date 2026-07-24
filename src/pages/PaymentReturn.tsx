import { useEffect, useState } from 'react';
import GoldWaves from '@/components/ui/GoldWaves';
import './payment.css';

type St = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refunded';

export default function PaymentReturn() {
  const [status, setStatus] = useState<St | 'loading'>('loading');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const ref = q.get('ref');
    if (!ref) { setStatus('failed'); return; }
    // On propage provider/token/cancel pour la capture PayPal éventuelle.
    const url = `/api/pay/status?ref=${encodeURIComponent(ref)}`
      + (q.get('provider') ? `&provider=${q.get('provider')}` : '')
      + (q.get('token') ? `&token=${q.get('token')}` : '')
      + (q.get('cancel') ? `&cancel=1` : '');

    let tries = 0;
    const poll = async () => {
      try {
        const r = await fetch(url); const d = await r.json();
        if (d.amount_cents) setAmount(`${(d.amount_cents / 100).toFixed(2)} ${d.currency}`);
        if (d.status && d.status !== 'pending') { setStatus(d.status); return; }
      } catch { /* réessai */ }
      if (++tries < 6) setTimeout(poll, 1500); else setStatus('pending');
    };
    poll();
  }, []);

  const view = {
    loading:   { i: '⏳', t: 'Vérification du paiement…', s: 'Merci de patienter quelques secondes.' },
    pending:   { i: '⏳', t: 'Paiement en cours de confirmation', s: 'Nous confirmerons par e-mail dès réception. Pour un virement, comptez 1 à 2 jours ouvrés.' },
    paid:      { i: '✓', t: 'Paiement confirmé', s: 'Merci ! Un reçu vous a été envoyé par e-mail.' },
    failed:    { i: '✕', t: 'Paiement échoué', s: 'La transaction n’a pas abouti. Vous pouvez réessayer.' },
    cancelled: { i: '—', t: 'Paiement annulé', s: 'Vous avez annulé le paiement.' },
    expired:   { i: '—', t: 'Session expirée', s: 'La session de paiement a expiré, veuillez recommencer.' },
    refunded:  { i: '↩', t: 'Paiement remboursé', s: 'Ce paiement a été remboursé.' },
  }[status];

  return (
    <>
      <GoldWaves />
      <main className="os-pay">
        <div className={`os-pay__card os-pay__result os-pay__result--${status}`}>
          <a href="/" className="os-pay__brand">OUI<span>STARS</span></a>
          <div className="os-pay__badge">{view.i}</div>
          <h1>{view.t}</h1>
          {amount && <p className="os-pay__amount">{amount}</p>}
          <p className="os-pay__lead">{view.s}</p>
          <a href="/" className="os-pay__home">Retour à l’accueil</a>
        </div>
      </main>
    </>
  );
}
