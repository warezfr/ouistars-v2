import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DocumentModal, { type DocData } from '../documents/DocumentModal';
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
    number: `DE-${q.reference.replace(/^OS-?/, '')}`,
    date: new Date().toISOString().slice(0, 10),
    client: { name: q.company, email: q.email, phone: q.phone },
    items: [{
      label: `Prestation événementielle — ${q.event}`,
      sub: `${q.dates} · ${q.vehicles} véhicule(s)${q.details ? ' · ' + q.details.slice(0, 80) : ''}`,
      qty: 1, unit: q.amount ?? 0,
    }],
    footNote: 'Devis valable 30 jours. Estimation susceptible d’ajustement selon le programme définitif.',
  });

  async function setStatus(r: Row, status: string) {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status } : x)));
    if (!supabase || r.demo) return;
    const { error } = await supabase.from('quotes').update({ status }).eq('id', r.id);
    if (error) setError(error.message);
  }

  return (
    <div className="card card-outline card-warning">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">Devis & Événements
          <span className="badge text-bg-secondary ms-2">{rows.length}</span>
          {rows[0]?.demo && <span className="badge text-bg-warning ms-2">démo</span>}
        </h3>
        <button className="btn btn-sm btn-outline-secondary" onClick={load}><i className="bi bi-arrow-clockwise" /></button>
      </div>
      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {!loading && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Réf.</th><th>Société / contact</th><th>Événement</th><th>Dates</th><th>Véh.</th><th>Estimation</th><th style={{ width: 150 }}>Statut</th></tr></thead>
              <tbody>
                {rows.map((q) => (
                  <tr key={q.id}>
                    <td className="fw-semibold">
                      <button className="btn btn-link p-0 fw-semibold" onClick={() => setView(toDoc(q))}>{q.reference}</button>
                    </td>
                    <td>{q.company}{q.email && <div className="small text-muted">{q.email}</div>}</td>
                    <td>{q.event}</td><td>{q.dates}</td><td>{q.vehicles}</td>
                    <td>{q.amount != null ? `${q.amount.toFixed(0)} €` : '—'}</td>
                    <td>
                      {writable && !q.demo ? (
                        <select className={`form-select form-select-sm badge-select`} value={q.status}
                          onChange={(e) => setStatus(q, e.target.value)}>
                          {STATUSES.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
                        </select>
                      ) : (
                        <span className={`badge ${badge(q.status)}`}>{LABELS[q.status] ?? q.status}</span>
                      )}
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
