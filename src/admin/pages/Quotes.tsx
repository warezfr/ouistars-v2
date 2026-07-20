import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DocumentModal, { type DocData } from '../documents/DocumentModal';
import NewQuoteModal from '../documents/NewQuoteModal';
import { ensureClient } from '../lib/clients';
import DataTable, { type Column } from '../ui/DataTable';
import { QUOTES as DEMO } from '../mockData';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';

interface Row {
  id: string; reference: string; company: string; contact?: string; email?: string; phone?: string;
  event: string; dates: string; vehicles: number; status: string; amount?: number; details?: string;
  demo?: boolean;
}

const STATUSES = ['new', 'in_progress', 'sent', 'accepted', 'rejected', 'invoiced', 'lost'];
const LABELS: Record<string, string> = {
  new: 'Nouveau', in_progress: 'En cours', sent: 'Envoyé', accepted: 'Accepté',
  rejected: 'Refusé', invoiced: 'Facturé', lost: 'Perdu',
};
const badge = (s: string) =>
  s === 'accepted' || s === 'invoiced' ? 'text-bg-success'
  : s === 'rejected' || s === 'lost' ? 'text-bg-secondary' : 'text-bg-warning';

export default function Quotes() {
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<DocData | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    if (supabase) {
      const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false }).limit(200);
      if (!error && data && data.length > 0) {
        setRows(data.map((q) => ({
          id: q.id, reference: q.reference, company: q.company ?? q.contact_name ?? '—',
          contact: q.contact_name ?? undefined, email: q.email ?? undefined, phone: q.phone ?? undefined,
          event: q.event_type ?? '—',
          dates: [q.start_date, q.end_date].filter(Boolean).join(' → ') || '—',
          vehicles: q.vehicles_count ?? 1, status: q.status,
          amount: q.amount_estimated != null ? Number(q.amount_estimated) : undefined,
          details: q.details ?? undefined,
        })));
        setLoading(false);
        return;
      }
      if (error) setError(error.message);
    }
    setRows(DEMO.map((q, i) => ({
      id: String(i), reference: q.reference, company: q.company, event: q.event,
      dates: q.dates, vehicles: q.vehicles, status: q.status, demo: true,
    })));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const toDoc = (q: Row): DocData => ({
    kind: 'quote',
    reference: q.reference,
    number: `DE-${q.reference.replace(/^OS-?|^DEV-?/, '')}`, // aligné sur le PDF serveur
    date: new Date().toISOString().slice(0, 10),
    client: { name: q.company, email: q.email, phone: q.phone },
    items: [{
      label: `Prestation événementielle — ${q.event}`,
      sub: `${q.dates} · ${q.vehicles} véhicule(s)${q.details ? ' · ' + q.details.slice(0, 80) : ''}`,
      qty: 1, unit: q.amount ?? 0,
    }],
    footNote: 'Devis valable 30 jours. Estimation susceptible d’ajustement selon le programme définitif.',
  });

  /** Devis accepté → réservation confirmée (la chaîne continue jusqu'à la facture). */
  async function convert(q: Row) {
    if (!supabase || q.demo) return;
    setInfo(null); setError(null);
    const parts = (q.contact ?? q.company ?? '').trim().split(/\s+/);
    const reference = `EV-${q.reference.replace(/^WEB-|^OS-|^DEV-/, '')}`;
    // Fiche client créée/complétée automatiquement (annuaire).
    ensureClient({ name: q.contact ?? q.company ?? '—', company: q.company, email: q.email, phone: q.phone }).catch(() => {});
    const { error } = await supabase.from('website_bookings').insert({
      reference,
      channel: 'devis',
      first_name: parts.shift() ?? q.company ?? '',
      last_name: parts.join(' '),
      email: q.email ?? null,
      phone: q.phone ?? null,
      pickup: q.event ?? 'Événement',
      destination: '—',
      travel_date: q.dates.split(' ')[0] || null,
      passengers: q.vehicles,
      prefill: `Événement : ${q.event} · ${q.dates} · ${q.vehicles} véhicule(s)`,
      notes: q.details ?? null,
      price_amount: q.amount ?? null,
      status: 'confirmed',
    });
    if (error) { setError(`Conversion impossible : ${error.message}`); return; }
    await setStatus(q, 'accepted');
    setInfo(`Devis converti en réservation ${reference} — retrouvez-la dans Réservations (et « À facturer » si un montant est renseigné).`);
  }

  /** Après création d'un devis manuel : recharge et ouvre l'aperçu du document. */
  async function onCreated(quoteId: string) {
    setCreating(false);
    await load();
    if (!supabase) return;
    const { data: q } = await supabase.from('quotes').select('*').eq('id', quoteId).maybeSingle();
    if (!q) return;
    setInfo(`Devis ${q.reference} créé — fiche client mise à jour automatiquement.`);
    setView(toDoc({
      id: q.id, reference: q.reference, company: q.company ?? q.contact_name ?? '—',
      contact: q.contact_name ?? undefined, email: q.email ?? undefined, phone: q.phone ?? undefined,
      event: q.event_type ?? '—',
      dates: [q.start_date, q.end_date].filter(Boolean).join(' → ') || '—',
      vehicles: q.vehicles_count ?? 1, status: q.status,
      amount: q.amount_estimated != null ? Number(q.amount_estimated) : undefined,
      details: q.details ?? undefined,
    }));
  }

  async function setStatus(r: Row, status: string) {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status } : x)));
    if (!supabase || r.demo) return;
    const { error } = await supabase.from('quotes').update({ status }).eq('id', r.id);
    if (error) setError(error.message);
  }

  const columns: Column<Row>[] = [
    { key: 'reference', header: 'Réf.', value: (q) => q.reference,
      render: (q) => <button className="btn btn-link p-0 fw-semibold" onClick={() => setView(toDoc(q))}>{q.reference}</button> },
    { key: 'company', header: 'Société / contact', value: (q) => q.company,
      render: (q) => <>{q.company}{q.email && <div className="small text-muted">{q.email}</div>}</> },
    { key: 'event', header: 'Événement', filterable: true, value: (q) => q.event },
    { key: 'dates', header: 'Dates', value: (q) => q.dates },
    { key: 'vehicles', header: 'Véh.', value: (q) => q.vehicles },
    { key: 'amount', header: 'Estimation', value: (q) => q.amount ?? 0, render: (q) => q.amount != null ? `${q.amount.toFixed(0)} €` : '—' },
    { key: 'status', header: 'Statut', filterable: true, sortable: false, width: 210,
      value: (q) => LABELS[q.status] ?? q.status,
      render: (q) => (
        <div className="d-flex gap-1 align-items-center">
          {writable && !q.demo && (q.status === 'accepted' || q.status === 'sent' || q.status === 'in_progress') && (
            <button className="btn btn-sm btn-success" title="Convertir en réservation" onClick={() => convert(q)}>
              <i className="bi bi-arrow-right-circle" />
            </button>
          )}
          {writable && !q.demo ? (
            <select className="form-select form-select-sm" value={q.status} onChange={(e) => setStatus(q, e.target.value)}>
              {STATUSES.map((st) => <option key={st} value={st}>{LABELS[st]}</option>)}
            </select>
          ) : <span className={`badge ${badge(q.status)}`}>{LABELS[q.status] ?? q.status}</span>}
        </div>
      ) },
  ];

  return (
    <div className="card card-outline card-warning">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">Devis & Événements
          <span className="badge text-bg-secondary ms-2">{rows.length}</span>
          {rows[0]?.demo && <span className="badge text-bg-warning ms-2">démo</span>}
        </h3>
        <div className="d-flex gap-2">
          {writable && (
            <button className="btn btn-sm btn-warning" onClick={() => setCreating(true)}
              title="Devis libre : client en saisie assistée, fiche auto-créée">
              <i className="bi bi-plus-lg me-1" />Nouveau devis
            </button>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={load}><i className="bi bi-arrow-clockwise" /></button>
        </div>
      </div>
      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {info && <div className="alert alert-success m-3">{info}</div>}
        {!loading && (
          <DataTable columns={columns} rows={rows} rowKey={(q) => q.id}
            searchPlaceholder="Rechercher réf., société, événement…" empty="Aucun devis." />
        )}
      </div>
      {creating && <NewQuoteModal onClose={() => setCreating(false)} onCreated={onCreated} />}
      {view && <DocumentModal doc={view} onClose={() => setView(null)} />}
    </div>
  );
}
