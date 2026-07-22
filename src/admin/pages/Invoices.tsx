import { authHeaders } from '@/admin/lib/authFetch';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DocumentModal, { type DocData, type DocItem } from '../documents/DocumentModal';
import NewInvoiceModal from '../documents/NewInvoiceModal';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';

/**
 * Facturation conforme : registre `invoices` (numérotation continue FA-AAAA-NNNN,
 * émission atomique via issue_invoice), statut payé/impayé, PDF archivé,
 * et liste des réservations facturables restantes.
 */
interface Invoice {
  id: string; number: string; reference: string; source: string;
  client_name: string; client_email?: string; client_phone?: string;
  route?: string; service_date?: string; amount: number;
  vat_rate?: number; items?: DocItem[] | null;
  status: 'unpaid' | 'paid' | 'cancelled'; issued_at: string; pdf_path?: string;
}
interface Billable {
  key: string; source: 'site' | 'etg'; reference: string; client: string;
  email?: string; phone?: string; route: string; date: string; amount: number; status: string;
}

const BILLABLE_STATUSES = ['confirmed', 'assigned', 'completed'];

export default function Invoices() {
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billables, setBillables] = useState<Billable[]>([]);
  const [registerReady, setRegisterReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<DocData | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    if (!supabase) { setError('Supabase non configuré.'); setLoading(false); return; }
    setLoading(true); setError(null);

    const inv = await supabase.from('invoices').select('*').order('issued_at', { ascending: false }).limit(300);
    if (inv.error) {
      // Table absente → registre pas encore migré
      setRegisterReady(false);
    } else {
      setRegisterReady(true);
      setInvoices((inv.data ?? []) as Invoice[]);
    }
    const invoicedRefs = new Set((inv.data ?? []).map((i) => i.reference));

    const out: Billable[] = [];
    const [site, etg] = await Promise.all([
      supabase.from('website_bookings').select('*').in('status', BILLABLE_STATUSES).order('created_at', { ascending: false }).limit(300),
      supabase.from('etg_orders').select('*').order('created_at', { ascending: false }).limit(300),
    ]);
    for (const b of site.data ?? []) {
      if (b.price_amount == null || invoicedRefs.has(b.reference)) continue;
      out.push({
        key: `s-${b.id}`, source: 'site', reference: b.reference,
        client: [b.first_name, b.last_name].filter(Boolean).join(' ') || b.email || '—',
        email: b.email ?? undefined, phone: b.phone ?? undefined,
        route: b.prefill || [b.pickup, b.destination].filter(Boolean).join(' → ') || '—',
        date: [b.travel_date, b.travel_time].filter(Boolean).join(' '),
        amount: Number(b.price_amount), status: b.status,
      });
    }
    for (const o of etg.data ?? []) {
      if (o.etg_status === 'cancelled' || o.price_amount == null || invoicedRefs.has(o.order_id)) continue;
      const mp = (o.main_passenger ?? {}) as { first_name?: string; last_name?: string; email?: string; phone_number?: string };
      out.push({
        key: `e-${o.order_id}`, source: 'etg', reference: o.order_id,
        client: [mp.first_name, mp.last_name].filter(Boolean).join(' ') || '—',
        email: mp.email, phone: mp.phone_number,
        route: `${o.search_payload?.start_point?.iata ?? o.search_payload?.start_point?.address ?? '—'} → ${o.search_payload?.end_point?.iata ?? o.search_payload?.end_point?.address ?? '—'}`,
        date: (o.start_time ?? '').replace('T', ' ').slice(0, 16),
        amount: Number(o.price_amount), status: o.workflow_status ?? 'confirmed',
      });
    }
    setBillables(out);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  /** Émet la facture (n° séquentiel atomique) puis archive le PDF dans Storage. */
  async function issue(b: Billable) {
    if (!supabase) return;
    setBusy(b.key); setError(null);
    try {
      const { data, error } = await supabase.rpc('issue_invoice', {
        p_reference: b.reference, p_source: b.source, p_client_name: b.client,
        p_client_email: b.email ?? null, p_client_phone: b.phone ?? null,
        p_route: b.route, p_service_date: b.date, p_amount: b.amount,
      });
      if (error) throw error;
      const row = data as Invoice;

      // Archive le PDF officiel dans le Storage (non bloquant).
      try {
        const res = await fetch('/api/documents/generate', {
          method: 'POST', headers: await authHeaders(),
          body: JSON.stringify({ reference: b.reference, type: 'invoice', number: row.number }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const rand = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');
          const path = `invoices/${row.number}-${rand}.pdf`;
          const up = await supabase.storage.from('cms').upload(path, blob, {
            upsert: true, contentType: 'application/pdf',
          });
          if (!up.error) await supabase.from('invoices').update({ pdf_path: path }).eq('id', row.id);
        }
      } catch { /* archivage best-effort */ }

      await load();
    } catch (e) {
      setError(`Émission impossible : ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function setPaid(inv: Invoice, paid: boolean) {
    if (!supabase) return;
    const { error } = await supabase.from('invoices')
      .update({ status: paid ? 'paid' : 'unpaid', paid_at: paid ? new Date().toISOString() : null })
      .eq('id', inv.id);
    if (error) setError(error.message); else load();
  }

  const toDoc = (i: Invoice): DocData => ({
    kind: 'invoice', reference: i.reference, number: i.number,
    date: (i.issued_at ?? '').slice(0, 10),
    client: { name: i.client_name, email: i.client_email, phone: i.client_phone },
    vatRate: i.vat_rate != null ? Number(i.vat_rate) : undefined,
    items: i.items?.length
      ? i.items.map((it) => ({ ...it, qty: Number(it.qty), unit: Number(it.unit) }))
      : [{ label: `Transport avec chauffeur — ${i.route ?? ''}`, sub: i.service_date, qty: 1, unit: Number(i.amount) }],
  });

  /** Après émission d'une facture manuelle : recharge et ouvre le document. */
  async function onCreated(invoiceId: string) {
    setCreating(false);
    await load();
    if (!supabase) return;
    const { data } = await supabase.from('invoices').select('*').eq('id', invoiceId).maybeSingle();
    if (data) setView(toDoc(data as Invoice));
  }

  const totalIssued = invoices.filter((i) => i.status !== 'cancelled').reduce((s, i) => s + Number(i.amount), 0);
  const totalUnpaid = invoices.filter((i) => i.status === 'unpaid').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      {!registerReady && (
        <div className="alert alert-warning">
          Le registre de factures n’est pas encore migré en base (table <code>invoices</code>) —
          exécutez la migration <code>0006_invoices.sql</code> dans Supabase.
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card card-outline card-warning mb-3">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h3 className="card-title mb-0">Registre des factures
            <span className="badge text-bg-secondary ms-2">{invoices.length}</span>
          </h3>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">
              Émis : <strong>{totalIssued.toFixed(0)} €</strong> · Impayé : <strong className="text-danger">{totalUnpaid.toFixed(0)} €</strong>
            </span>
            {writable && (
              <button className="btn btn-sm btn-warning" disabled={!registerReady} onClick={() => setCreating(true)}
                title="Facture libre : client en saisie assistée, lignes multiples">
                <i className="bi bi-plus-lg me-1" />Nouvelle facture
              </button>
            )}
          </div>
        </div>
        <div className="card-body p-0">
          {loading && <div className="p-3 text-muted">Chargement…</div>}
          {!loading && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead><tr><th>N°</th><th>Réf.</th><th>Client</th><th>Trajet</th><th>Émise le</th><th>Montant TTC</th><th>Statut</th><th className="text-end pe-3">Actions</th></tr></thead>
                <tbody>
                  {invoices.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-muted py-4">
                      Aucune facture émise — utilisez « Émettre » sur une réservation facturable ci-dessous.
                    </td></tr>
                  )}
                  {invoices.map((i) => (
                    <tr key={i.id}>
                      <td className="fw-semibold">{i.number}</td>
                      <td>{i.reference}</td>
                      <td>{i.client_name}</td>
                      <td className="small">{i.route}</td>
                      <td>{(i.issued_at ?? '').slice(0, 10)}</td>
                      <td>{Number(i.amount).toFixed(0)} €</td>
                      <td>
                        <span className={`badge ${i.status === 'paid' ? 'text-bg-success' : i.status === 'cancelled' ? 'text-bg-secondary' : 'text-bg-danger'}`}>
                          {i.status === 'paid' ? 'Payée' : i.status === 'cancelled' ? 'Annulée' : 'Impayée'}
                        </span>
                      </td>
                      <td className="text-end pe-3 text-nowrap">
                        <button className="btn btn-sm btn-warning me-1" title="Voir" onClick={() => setView(toDoc(i))}>
                          <i className="bi bi-eye" />
                        </button>
                        {writable && i.status !== 'cancelled' && (
                          <button className={`btn btn-sm ${i.status === 'paid' ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                            title={i.status === 'paid' ? 'Marquer impayée' : 'Marquer payée'}
                            onClick={() => setPaid(i, i.status !== 'paid')}>
                            <i className={`bi ${i.status === 'paid' ? 'bi-arrow-counterclockwise' : 'bi-check2-circle'}`} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card card-outline card-secondary">
        <div className="card-header">
          <h3 className="card-title mb-0">À facturer
            <span className="badge text-bg-warning ms-2">{billables.length}</span>
          </h3>
        </div>
        <div className="card-body p-0">
          {!loading && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead><tr><th>Réf.</th><th>Client</th><th>Trajet</th><th>Date</th><th>Montant</th><th className="text-end pe-3">Émettre</th></tr></thead>
                <tbody>
                  {billables.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted py-4">
                      Rien à facturer — les réservations confirmées/terminées avec montant apparaissent ici.
                    </td></tr>
                  )}
                  {billables.map((b) => (
                    <tr key={b.key}>
                      <td className="fw-semibold">{b.reference}</td>
                      <td>{b.client}</td><td className="small">{b.route}</td><td>{b.date || '—'}</td>
                      <td>{b.amount.toFixed(0)} €</td>
                      <td className="text-end pe-3">
                        <button className="btn btn-sm btn-warning" disabled={!writable || !registerReady || busy === b.key}
                          onClick={() => issue(b)}>
                          <i className={`bi ${busy === b.key ? 'bi-hourglass-split' : 'bi-receipt'} me-1`} />
                          {busy === b.key ? 'Émission…' : 'Émettre la facture'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {creating && <NewInvoiceModal onClose={() => setCreating(false)} onCreated={onCreated} />}
      {view && <DocumentModal doc={view} onClose={() => setView(null)} />}
    </>
  );
}
