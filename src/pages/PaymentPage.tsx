import { useEffect, useMemo, useState } from 'react';
import GoldWaves from '@/components/ui/GoldWaves';
import './payment.css';

type Method = 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'sumup' | 'bank_transfer';

const META: Record<Method, { label: string; sub: string; icon: string }> = {
  card:          { label: 'Carte bancaire', sub: 'CB · Visa · Mastercard · Amex', icon: '💳' },
  apple_pay:     { label: 'Apple Pay', sub: 'Paiement express', icon: '' },
  google_pay:    { label: 'Google Pay', sub: 'Paiement express', icon: '' },
  paypal:        { label: 'PayPal', sub: 'Compte ou carte', icon: '' },
  sumup:         { label: 'SumUp', sub: 'Carte via SumUp', icon: '' },
  bank_transfer: { label: 'Virement bancaire', sub: 'IBAN + référence', icon: '' },
};
const ORDER: Method[] = ['card', 'apple_pay', 'google_pay', 'paypal', 'sumup', 'bank_transfer'];

export default function PaymentPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const invoice = params.get('invoice') ?? undefined;
  const amountParam = params.get('amount'); // centimes (lien admin)

  const [methods, setMethods] = useState<Method[] | null>(null);
  const [busy, setBusy] = useState<Method | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bank, setBank] = useState<null | { beneficiary: string; iban: string; bic: string; reference: string; amount: string; note: string }>(null);

  useEffect(() => {
    fetch('/api/pay/create').then((r) => r.json())
      .then((d) => setMethods((d.methods ?? []) as Method[]))
      .catch(() => setMethods([]));
  }, []);

  async function pay(method: Method) {
    setBusy(method); setError(null); setBank(null);
    try {
      const r = await fetch('/api/pay/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, invoiceNumber: invoice, amountCents: amountParam ? Number(amountParam) : undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `Erreur ${r.status}`);

      if (d.redirectUrl) { window.location.href = d.redirectUrl; return; }          // PayPal / SumUp
      if (d.formPost) { submitForm(d.formPost.action, d.formPost.fields); return; }  // Systempay
      if (d.bankTransfer) { setBank(d.bankTransfer); return; }                       // Virement
      throw new Error('Réponse de paiement inattendue.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <GoldWaves />
      <main className="os-pay">
        <div className="os-pay__card">
          <a href="/" className="os-pay__brand">OUI<span>STARS</span></a>
          <p className="os-pay__eyebrow">Paiement sécurisé</p>
          <h1>Régler {invoice ? `la facture ${invoice}` : 'votre commande'}</h1>
          <p className="os-pay__lead">Choisissez votre moyen de paiement. Vos données bancaires ne transitent jamais par nos serveurs.</p>

          {methods === null && <p className="os-pay__mut">Chargement des moyens de paiement…</p>}
          {methods !== null && methods.length === 0 && (
            <p className="os-pay__mut">Aucun moyen de paiement n’est configuré pour le moment.</p>
          )}

          {!bank && methods && methods.length > 0 && (
            <div className="os-pay__methods">
              {ORDER.filter((m) => methods.includes(m)).map((m) => (
                <button key={m} className="os-pay__method" disabled={busy !== null} onClick={() => pay(m)}>
                  <span className="os-pay__mi">{META[m].icon || '◆'}</span>
                  <span className="os-pay__mt"><strong>{META[m].label}</strong><small>{META[m].sub}</small></span>
                  <span className="os-pay__go">{busy === m ? '…' : '→'}</span>
                </button>
              ))}
            </div>
          )}

          {bank && (
            <div className="os-pay__bank">
              <h2>Virement bancaire</h2>
              <dl>
                <div><dt>Bénéficiaire</dt><dd>{bank.beneficiary}</dd></div>
                <div><dt>IBAN</dt><dd className="mono">{bank.iban}</dd></div>
                <div><dt>BIC</dt><dd className="mono">{bank.bic}</dd></div>
                <div><dt>Montant</dt><dd>{bank.amount}</dd></div>
                <div><dt>Référence</dt><dd className="mono ref">{bank.reference}</dd></div>
              </dl>
              <p className="os-pay__note">{bank.note}</p>
              <button className="os-pay__back" onClick={() => setBank(null)}>← Autre moyen de paiement</button>
            </div>
          )}

          {error && <p className="os-pay__err">{error}</p>}
          <p className="os-pay__foot">🔒 Connexion chiffrée · Oui Stars</p>
        </div>
      </main>
    </>
  );
}

function submitForm(action: string, fields: Record<string, string>) {
  const f = document.createElement('form');
  f.method = 'POST'; f.action = action;
  for (const [k, v] of Object.entries(fields)) {
    const i = document.createElement('input');
    i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i);
  }
  document.body.appendChild(f); f.submit();
}
