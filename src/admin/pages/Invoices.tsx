import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DocumentModal, { type DocData } from '../documents/DocumentModal';

/**
 * Factures — générées à la volée depuis les réservations facturables
 * (confirmée / assignée / terminée). Numérotation FA-<réf>.
 */
interface Row {
  key: string;
  source: 'site' | 'etg';
  reference: string;
  client: string;
  email?: string;
  route: string;
  date: string;
  amount: number;
  status: string;
}

const BILLABLE = ['confirmed', 'assigned', 'completed'];

export default function Invoices() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<DocData | null>(null);

  useEffect(() => {
    (async () => {
      if (!supabase) { setError('Supabase non configuré.'); setLoading(false); return; }
      const out: Row[] = [];
      const [site, etg] = await Promise.all([
        supabase.from('website_bookings').select('*').in('status', BILLABLE).order('created_at', { ascending: false }).limit(300),
        supabase.from('etg_orders').select('*').order('created_at', { ascending: false }).limit(300),
      ]);
      if (site.error && etg.error) { setError(site.error.message); setLoading(false); return; }
      for (const b of site.data ?? []) {
        if (b.price_amount == null) continue;
        out.push({
          key: `s-${b.id}`, source: 'site', reference: b.reference,
          client: [b.first_name, b.last_name].filter(Boolean).join(' ') || b.email || '—',
          email: b.email ?? undefined,
          route: b.prefill || [b.pickup, b.destination].filter(Boolean).join(' → ') || '—',
          date: [b.travel_date, b.travel_time].filter(Boolean).join(' '),
          amount: Number(b.price_amount), status: b.status,
        });
      }
      for (const o of etg.data ?? []) {
        if (o.etg_status === 'cancelled') continue;
        const mp = (o.main_passenger ?? {}) as { first_name?: string; last_name?: string; email?: string };
        out.push({
          key: `e-${o.order_id}`, source: 'etg', reference: o.order_id,
          client: [mp.first_name, mp.last_name].filter(Boolean).join(' ') || '—',
          email: mp.email,
          route: `${(o.search_payload?.start_point?.iata ?? o.search_payload?.start_point?.address ?? '—')} → ${(o.search_payload?.end_point?.iata ?? o.search_payload?.end_point?.address ?? '—')}`,
          date: (o.start_time ?? '').replace('T', ' ').slice(0, 16),
          amount: Number(o.price_amount ?? 0), status: o.workflow_status ?? 'confirmed',
        });
      }
      setRows(out);
      setLoading(false);
    })();
  }, []);

  async function download(r: Row) {
    setBusy(r.key);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: r.reference, type: 'invoice' }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `FA-${r.reference}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Génération impossible (vérifiez SUPABASE_SERVICE_ROLE_KEY côté Vercel).');
    } finally {
      setBusy(null);
    }
  }

  const total = rows.reduce((s, r) => s + r.amount, 0);

  const toDoc = (r: Row): DocData => ({
    kind: 'invoice',
    reference: r.reference,
    number: `FA-${r.reference.replace(/^OS-?/, '')}`,
    date: new Date().toISOString().slice(0, 10),
    client: { name: r.client, email: r.email },
    items: [{ label: `Transport avec chauffeur — ${r.route}`, sub: r.date, qty: 1, unit: r.amount }],
  });

  return (
    <div className="card card-outline card-warning">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">Factures
          <span className="badge text-bg-secondary ms-2">{rows.length}</span>
        </h3>
        <span className="text-muted small">Total facturable : <strong>{total.toFixed(0)} €</strong></span>
      </div>
      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {!loading && !error && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>N° facture</th><th>Réf.</th><th>Client</th><th>Trajet</th><th>Date</th><th>Montant TTC</th><th>Statut</th><th className="text-end pe-3">PDF</th></tr></thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-muted py-4">
                    Aucune réservation facturable — les factures se génèrent depuis les réservations confirmées / terminées.
                  </td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td className="fw-semibold">FA-{r.reference.replace(/^OS-?/, '')}</td>
                    <td>{r.reference}</td>
                    <td>{r.client}</td>
                    <td>{r.route}</td>
                    <td>{r.date || '—'}</td>
                    <td>{r.amount.toFixed(0)} €</td>
                    <td><span className={`badge ${r.status === 'completed' ? 'text-bg-success' : 'text-bg-warning'}`}>{r.status}</span></td>
                    <td className="text-end pe-3 text-nowrap">
                      <button className="btn btn-sm btn-warning me-1" title="Voir la facture" onClick={() => setView(toDoc(r))}>
                        <i className="bi bi-eye" />
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" title="PDF direct" onClick={() => download(r)} disabled={busy === r.key}>
                        <i className={`bi ${busy === r.key ? 'bi-hourglass-split' : 'bi-file-earmark-pdf'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {view && <DocumentModal doc={view} onClose={() => setView(null)} />}
    </div>
  );
}
