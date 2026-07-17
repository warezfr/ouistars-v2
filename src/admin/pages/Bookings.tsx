import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { listEntries } from '../cms/api';
import { BOOKINGS as DEMO } from '../mockData';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';

type Status = 'pending' | 'confirmed' | 'assigned' | 'completed' | 'cancelled';

interface Row {
  key: string;
  source: 'site' | 'etg' | 'demo';
  id: string;                 // id BDD (uuid site / order_id etg)
  reference: string;
  client: string;
  contact?: string;
  route: string;
  date: string;
  vehicle: string;
  driver?: string;
  amount?: number;
  status: Status;
  notes?: string;
}

const STATUS_LABELS: Record<Status, string> = {
  pending: 'En attente', confirmed: 'Confirmée', assigned: 'Assignée',
  completed: 'Terminée', cancelled: 'Annulée',
};
const STATUSES = Object.keys(STATUS_LABELS) as Status[];
const badge = (s: Status) =>
  s === 'completed' ? 'text-bg-success' : s === 'cancelled' ? 'text-bg-secondary'
  : s === 'assigned' ? 'text-bg-info' : 'text-bg-warning';

const normalizeEtg = (s: string | null | undefined): Status =>
  s === 'cancelled' ? 'cancelled'
  : s === 'completed' || s === 'done' ? 'completed'
  : s === 'assigned' ? 'assigned'
  : s === 'confirmed' ? 'confirmed' : 'pending';

export default function Bookings() {
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);

  const [rows, setRows] = useState<Row[]>([]);
  const [drivers, setDrivers] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Status>('all');

  async function load() {
    setLoading(true); setError(null);
    const out: Row[] = [];
    if (supabase) {
      const [site, etg, drv] = await Promise.all([
        supabase.from('website_bookings').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('etg_orders').select('*').order('created_at', { ascending: false }).limit(200),
        listEntries('driver').catch(() => []),
      ]);
      setDrivers(drv.map((d) => (d.data?.name as string) || d.title || '').filter(Boolean));
      if (!site.error) {
        for (const b of site.data ?? []) {
          out.push({
            key: `site-${b.id}`, source: 'site', id: b.id,
            reference: b.reference,
            client: [b.first_name, b.last_name].filter(Boolean).join(' ') || b.email || '—',
            contact: b.phone ?? b.email ?? undefined,
            route: b.prefill || [b.pickup, b.destination].filter(Boolean).join(' → ') || '—',
            date: [b.travel_date, b.travel_time].filter(Boolean).join(' ') || '—',
            vehicle: b.vehicle_class ?? '—',
            driver: b.notes?.match(/\[chauffeur:(.+?)\]/)?.[1],
            amount: b.price_amount != null ? Number(b.price_amount) : undefined,
            status: (STATUSES.includes(b.status) ? b.status : 'pending') as Status,
            notes: b.notes ?? undefined,
          });
        }
      }
      if (!etg.error) {
        for (const o of etg.data ?? []) {
          out.push({
            key: `etg-${o.order_id}`, source: 'etg', id: o.order_id,
            reference: o.order_id,
            client: [o.main_passenger?.first_name, o.main_passenger?.last_name].filter(Boolean).join(' ') || '—',
            contact: o.main_passenger?.phone_number,
            route: `${o.search_payload?.start_point?.iata ?? o.search_payload?.start_point?.address ?? '—'} → ${o.search_payload?.end_point?.iata ?? o.search_payload?.end_point?.address ?? '—'}`,
            date: (o.start_time ?? '').replace('T', ' ').slice(0, 16),
            vehicle: o.transfer_category ?? '—',
            amount: o.price_amount != null ? Number(o.price_amount) : undefined,
            status: normalizeEtg(o.workflow_status === 'pending' ? o.etg_status : o.workflow_status),
          });
        }
      }
      if (site.error && etg.error) setError(`Accès BDD refusé (RLS) : ${site.error.message}`);
    }
    if (out.length === 0) {
      for (const b of DEMO) {
        out.push({
          key: `demo-${b.reference}`, source: 'demo', id: b.reference, reference: b.reference,
          client: b.client, route: b.route, date: b.date, vehicle: b.vehicle,
          driver: b.driver, amount: b.amount,
          status: (STATUSES.includes(b.status as Status) ? b.status : 'pending') as Status,
        });
      }
    }
    setRows(out);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const selected = useMemo(() => rows.find((r) => r.key === selectedKey) ?? null, [rows, selectedKey]);
  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  const patchLocal = (key: string, changes: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  async function setStatus(row: Row, status: Status) {
    patchLocal(row.key, { status });
    if (!supabase || row.source === 'demo') return;
    if (row.source === 'site') {
      const { error } = await supabase.from('website_bookings')
        .update({ status, updated_at: new Date().toISOString() }).eq('id', row.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('etg_orders')
        .update({ workflow_status: status, etg_status: status === 'cancelled' ? 'cancelled' : 'confirmed' })
        .eq('order_id', row.id);
      if (error) setError(error.message);
    }
  }

  async function setDriver(row: Row, driver: string) {
    patchLocal(row.key, { driver: driver || undefined });
    if (!supabase || row.source !== 'site') return;
    const base = (row.notes ?? '').replace(/\s*\[chauffeur:.+?\]/, '');
    const notes = driver ? `${base} [chauffeur:${driver}]`.trim() : base || null;
    const { error } = await supabase.from('website_bookings')
      .update({ notes, updated_at: new Date().toISOString() }).eq('id', row.id);
    if (error) setError(error.message);
  }

  return (
    <>
      <div className="card card-outline card-warning">
        <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h3 className="card-title mb-0">Réservations
            <span className="badge text-bg-secondary ms-2">{rows.length}</span>
            {rows[0]?.source === 'demo' && <span className="badge text-bg-warning ms-2">démo</span>}
          </h3>
          <div className="d-flex gap-2">
            <select className="form-select form-select-sm" value={filter} onChange={(e) => setFilter(e.target.value as never)}>
              <option value="all">Tous statuts</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <button className="btn btn-sm btn-outline-secondary" onClick={load}><i className="bi bi-arrow-clockwise" /></button>
          </div>
        </div>
        <div className="card-body p-0">
          {loading && <div className="p-3 text-muted">Chargement…</div>}
          {error && <div className="alert alert-danger m-3">{error}</div>}
          {!loading && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ cursor: 'pointer' }}>
                <thead><tr><th>Réf.</th><th>Source</th><th>Client</th><th>Trajet</th><th>Date</th><th>Véhicule</th><th>Chauffeur</th><th>Montant</th><th>Statut</th></tr></thead>
                <tbody>
                  {shown.length === 0 && <tr><td colSpan={9} className="text-center text-muted py-4">Aucune réservation.</td></tr>}
                  {shown.map((b) => (
                    <tr key={b.key} className={b.key === selectedKey ? 'table-active' : undefined} onClick={() => setSelectedKey(b.key)}>
                      <td className="fw-semibold">{b.reference}</td>
                      <td><span className={`badge ${b.source === 'etg' ? 'text-bg-primary' : 'text-bg-light border'}`}>{b.source === 'etg' ? 'ETG' : b.source === 'demo' ? 'démo' : 'Site'}</span></td>
                      <td>{b.client}</td><td>{b.route}</td><td>{b.date}</td><td>{b.vehicle}</td>
                      <td>{b.driver ?? '—'}</td>
                      <td>{b.amount != null ? `${b.amount} €` : '—'}</td>
                      <td><span className={`badge ${badge(b.status)}`}>{STATUS_LABELS[b.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <>
          <div className="offcanvas-backdrop fade show" onClick={() => setSelectedKey(null)} />
          <div className="offcanvas offcanvas-end show" tabIndex={-1} style={{ visibility: 'visible', width: 'min(460px, 92vw)' }}>
            <div className="offcanvas-header border-bottom">
              <h5 className="offcanvas-title">{selected.reference}
                <span className={`badge ms-2 ${badge(selected.status)}`}>{STATUS_LABELS[selected.status]}</span>
              </h5>
              <button type="button" className="btn-close" onClick={() => setSelectedKey(null)} />
            </div>
            <div className="offcanvas-body">
              <dl className="row mb-3">
                <dt className="col-5 text-muted fw-normal">Source</dt><dd className="col-7">{selected.source === 'etg' ? 'API ETG' : 'Site web'}</dd>
                <dt className="col-5 text-muted fw-normal">Client</dt><dd className="col-7">{selected.client}</dd>
                {selected.contact && <><dt className="col-5 text-muted fw-normal">Contact</dt><dd className="col-7">{selected.contact}</dd></>}
                <dt className="col-5 text-muted fw-normal">Trajet</dt><dd className="col-7">{selected.route}</dd>
                <dt className="col-5 text-muted fw-normal">Date</dt><dd className="col-7">{selected.date}</dd>
                <dt className="col-5 text-muted fw-normal">Véhicule</dt><dd className="col-7">{selected.vehicle}</dd>
                <dt className="col-5 text-muted fw-normal">Montant</dt><dd className="col-7">{selected.amount != null ? `${selected.amount} €` : '—'}</dd>
              </dl>

              <label className="form-label">Statut</label>
              <select className="form-select mb-3" value={selected.status} disabled={!writable}
                onChange={(e) => setStatus(selected, e.target.value as Status)}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>

              {selected.source === 'site' && (
                <>
                  <label className="form-label">Chauffeur assigné</label>
                  <select className="form-select mb-3" value={selected.driver ?? ''} disabled={!writable}
                    onChange={(e) => setDriver(selected, e.target.value)}>
                    <option value="">— Aucun —</option>
                    {[...new Set([...(selected.driver ? [selected.driver] : []), ...drivers])].map((d) =>
                      <option key={d} value={d}>{d}</option>)}
                  </select>
                </>
              )}

              {selected.source === 'demo' && (
                <div className="alert alert-warning small">
                  Donnée de démonstration — les vraies réservations du site et de l’API ETG
                  apparaîtront ici automatiquement.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
