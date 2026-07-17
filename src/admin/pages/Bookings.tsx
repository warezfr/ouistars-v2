import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { listEntries, createEntry } from '../cms/api';
import { BOOKINGS as DEMO } from '../mockData';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';
import DocumentModal, { type DocData } from '../documents/DocumentModal';
import DataTable, { type Column } from '../ui/DataTable';

type Status = 'pending' | 'confirmed' | 'assigned' | 'completed' | 'cancelled';

interface Row {
  key: string;
  source: 'site' | 'etg' | 'demo';
  id: string;                 // id BDD (uuid site / order_id etg)
  reference: string;
  client: string;
  contact?: string;
  email?: string;
  phone?: string;
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
  const [drivers, setDrivers] = useState<{ name: string; email?: string; phone?: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<DocData | null>(null);

  /** Journal d'audit (collection booking_log) : qui a fait quoi, quand. */
  async function logAction(reference: string, action: string, detail?: string) {
    try {
      await createEntry({
        collection: 'booking_log', title: reference, status: 'draft', position: 0, // draft = admins seulement (RLS)
        data: { reference, action, detail: detail ?? '', by: profile?.email ?? '—', at: new Date().toISOString() },
      });
    } catch { /* le journal ne doit jamais bloquer l'action */ }
  }

  const [history, setHistory] = useState<{ action: string; detail?: string; by: string; at: string }[]>([]);
  useEffect(() => {
    const ref = rows.find((r) => r.key === selectedKey)?.reference;
    if (!ref) { setHistory([]); return; }
    let cancel = false;
    listEntries('booking_log').then((all) => {
      if (cancel) return;
      setHistory(all
        .map((e) => e.data as { reference?: string; action: string; detail?: string; by: string; at: string })
        .filter((e) => e.reference === ref)
        .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '')));
    }).catch(() => setHistory([]));
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, rows]);

  async function load() {
    setLoading(true); setError(null);
    const out: Row[] = [];
    if (supabase) {
      const [site, etg, drv] = await Promise.all([
        supabase.from('website_bookings').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('etg_orders').select('*').order('created_at', { ascending: false }).limit(200),
        listEntries('driver').catch(() => []),
      ]);
      setDrivers(drv.map((d) => ({
        name: ((d.data?.name as string) || d.title || '').trim(),
        email: (d.data?.email as string) || undefined,
        phone: (d.data?.whatsapp as string) || (d.data?.phone as string) || undefined,
      })).filter((d) => d.name));
      if (!site.error) {
        for (const b of site.data ?? []) {
          out.push({
            key: `site-${b.id}`, source: 'site', id: b.id,
            reference: b.reference,
            client: [b.first_name, b.last_name].filter(Boolean).join(' ') || b.email || '—',
            contact: b.phone ?? b.email ?? undefined,
            email: b.email ?? undefined,
            phone: b.phone ?? undefined,
            route: b.prefill || [b.pickup, b.destination].filter(Boolean).join(' → ') || '—',
            date: [b.travel_date, b.travel_time].filter(Boolean).join(' ') || '—',
            vehicle: b.vehicle_class ?? '—',
            driver: b.driver_name ?? b.notes?.match(/\[chauffeur:(.+?)\]/)?.[1],
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
            email: o.main_passenger?.email ?? undefined,
            phone: o.main_passenger?.phone_number ?? undefined,
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
  const patchLocal = (key: string, changes: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  const toDoc = (r: Row, kind: 'mission' | 'order'): DocData => {
    const [datePart, ...timeParts] = (r.date ?? '').split(' ');
    const [pickup, destination] = r.route.includes('→')
      ? r.route.split('→').map((x) => x.trim())
      : [r.route, ''];
    const isEmail = (r.contact ?? '').includes('@');
    return {
      kind,
      reference: r.reference,
      number: `${kind === 'mission' ? 'OM' : 'BC'}-${r.reference.replace(/^OS-?/, '')}`,
      date: new Date().toISOString().slice(0, 10),
      client: { name: r.client, phone: r.phone ?? (isEmail ? undefined : r.contact), email: r.email ?? (isEmail ? r.contact : undefined) },
      items: [{ label: `Transport avec chauffeur — ${r.route}`, sub: r.date, qty: 1, unit: r.amount ?? 0 }],
      mission: {
        date: datePart || '—', time: timeParts.join(' ') || undefined,
        pickup, destination, vehicle: r.vehicle, driver: r.driver, notes: r.notes,
      },
    };
  };

  async function setStatus(row: Row, status: Status) {
    patchLocal(row.key, { status });
    if (!supabase || row.source === 'demo') return;
    logAction(row.reference, 'Statut', `${STATUS_LABELS[row.status]} → ${STATUS_LABELS[status]}`);
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
    // Colonne dédiée si présente (migration 0008), balise notes en compat.
    let { error } = await supabase.from('website_bookings')
      .update({ driver_name: driver || null, notes, updated_at: new Date().toISOString() }).eq('id', row.id);
    if (error && error.message.includes('driver_name')) {
      ({ error } = await supabase.from('website_bookings')
        .update({ notes, updated_at: new Date().toISOString() }).eq('id', row.id));
    }
    if (error) { setError(error.message); return; }
    logAction(row.reference, 'Chauffeur', driver ? `Assigné : ${driver}` : 'Désassigné');

    // Fiche de mission envoyée automatiquement au chauffeur (si e-mail + Resend).
    const d = drivers.find((x) => x.name === driver);
    if (driver && d?.email) {
      setNotice(`Envoi de la fiche de mission à ${d.email}…`);
      try {
        const res = await fetch('/api/documents/send', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: row.reference, type: 'mission_sheet', to: d.email,
            message: `Nouvelle mission ${row.reference} — ${row.route} le ${row.date}. Fiche en pièce jointe.` }),
        });
        setNotice(res.ok
          ? `✓ Fiche de mission envoyée à ${driver} (${d.email})`
          : res.status === 501
            ? 'Chauffeur assigné — envoi e-mail non configuré (RESEND_API_KEY).'
            : 'Chauffeur assigné — échec de l’envoi de la fiche.');
      } catch { setNotice('Chauffeur assigné — échec de l’envoi de la fiche.'); }
    }
  }

  /** Création manuelle (téléphone, e-mail, comptoir…). */
  async function createManual(form: Record<string, string>) {
    if (!supabase) return;
    const reference = `MAN-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    const parts = (form.client ?? '').trim().split(/\s+/);
    const { error } = await supabase.from('website_bookings').insert({
      reference, channel: 'manuel',
      first_name: parts.shift() ?? '', last_name: parts.join(' '),
      phone: form.phone || null, email: form.email || null,
      pickup: form.pickup || '—', destination: form.destination || '—',
      travel_date: form.date || null, travel_time: form.time || null,
      passengers: Number(form.passengers || 1),
      vehicle_class: form.vehicle || null,
      price_amount: form.amount ? Number(form.amount) : null,
      status: 'confirmed',
    });
    if (error) { setError(`Création impossible : ${error.message}`); return; }
    setCreating(false);
    logAction(reference, 'Création', 'Saisie manuelle depuis le back-office');
    setNotice(`Réservation ${reference} créée.`);
    load();
  }

  const SRC_LABEL: Record<string, string> = { site: 'Site', etg: 'ETG', demo: 'démo' };
  const bookingColumns: Column<Row>[] = [
    { key: 'reference', header: 'Réf.', value: (r) => r.reference, render: (r) => <span className="fw-semibold">{r.reference}</span> },
    { key: 'source', header: 'Source', filterable: true, value: (r) => SRC_LABEL[r.source],
      render: (r) => <span className={`badge ${r.source === 'etg' ? 'text-bg-primary' : 'text-bg-light border'}`}>{SRC_LABEL[r.source]}</span> },
    { key: 'client', header: 'Client', value: (r) => r.client },
    { key: 'route', header: 'Trajet', value: (r) => r.route },
    { key: 'date', header: 'Date', value: (r) => r.date },
    { key: 'vehicle', header: 'Véhicule', filterable: true, value: (r) => r.vehicle },
    { key: 'driver', header: 'Chauffeur', value: (r) => r.driver ?? '—' },
    { key: 'amount', header: 'Montant', value: (r) => r.amount ?? 0, render: (r) => r.amount != null ? `${r.amount} €` : '—' },
    { key: 'status', header: 'Statut', filterable: true, value: (r) => STATUS_LABELS[r.status],
      render: (r) => <span className={`badge ${badge(r.status)}`}>{STATUS_LABELS[r.status]}</span> },
  ];

  return (
    <>
      <div className="card card-outline card-warning">
        <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h3 className="card-title mb-0">Réservations
            <span className="badge text-bg-secondary ms-2">{rows.length}</span>
            {rows[0]?.source === 'demo' && <span className="badge text-bg-warning ms-2">démo</span>}
          </h3>
          <div className="d-flex gap-2">
            {writable && (
              <button className="btn btn-sm btn-warning" onClick={() => setCreating(true)}>
                <i className="bi bi-plus-lg me-1" />Nouvelle réservation
              </button>
            )}
            <button className="btn btn-sm btn-outline-secondary" onClick={load}><i className="bi bi-arrow-clockwise" /></button>
          </div>
        </div>
        <div className="card-body p-0">
          {loading && <div className="p-3 text-muted">Chargement…</div>}
          {error && <div className="alert alert-danger m-3">{error}</div>}
          {notice && <div className="alert alert-info m-3">{notice}</div>}
          {!loading && (
            <DataTable columns={bookingColumns} rows={rows} rowKey={(r) => r.key}
              rowClass={(r) => r.key === selectedKey ? 'table-active' : undefined}
              onRowClick={(r) => setSelectedKey(r.key)}
              searchPlaceholder="Rechercher réf., client, trajet…"
              empty="Aucune réservation." />
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
                    {[...new Set([...(selected.driver ? [selected.driver] : []), ...drivers.map((d) => d.name)])].map((d) =>
                      <option key={d} value={d}>{d}</option>)}
                  </select>
                </>
              )}

              {history.length > 0 && (
                <div className="card bg-body-tertiary mb-3">
                  <div className="card-body py-2">
                    <h6 className="card-title mb-2"><i className="bi bi-clock-history me-1" />Historique</h6>
                    <ul className="list-unstyled small mb-0">
                      {history.slice(0, 6).map((h, i) => (
                        <li key={i} className="mb-1">
                          <span className="text-muted">{(h.at ?? '').replace('T', ' ').slice(0, 16)}</span>
                          {' — '}<strong>{h.action}</strong>{h.detail ? ` : ${h.detail}` : ''}
                          <span className="text-muted"> · {h.by}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="card bg-body-tertiary mb-3">
                <div className="card-body py-2">
                  <h6 className="card-title mb-1">Documents</h6>
                  <p className="text-muted small mb-2">Ordre de mission (avec écran d'accueil tablette) et bon de commande.</p>
                  <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-sm btn-warning" onClick={() => setView(toDoc(selected, 'mission'))}>
                      <i className="bi bi-card-heading me-1" />Ordre de mission
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setView(toDoc(selected, 'order'))}>
                      <i className="bi bi-receipt-cutoff me-1" />Bon de commande
                    </button>
                  </div>
                </div>
              </div>

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
      {creating && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setCreating(false)} />
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  createManual(Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)])));
                }}>
                  <div className="modal-header">
                    <h5 className="modal-title">Nouvelle réservation (manuelle)</h5>
                    <button type="button" className="btn-close" onClick={() => setCreating(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="row g-2">
                      <div className="col-12"><label className="form-label">Client *</label>
                        <input name="client" className="form-control" required placeholder="Prénom Nom" /></div>
                      <div className="col-6"><label className="form-label">Téléphone</label>
                        <input name="phone" className="form-control" /></div>
                      <div className="col-6"><label className="form-label">E-mail</label>
                        <input name="email" type="email" className="form-control" /></div>
                      <div className="col-6"><label className="form-label">Départ *</label>
                        <input name="pickup" className="form-control" required /></div>
                      <div className="col-6"><label className="form-label">Destination *</label>
                        <input name="destination" className="form-control" required /></div>
                      <div className="col-4"><label className="form-label">Date</label>
                        <input name="date" type="date" className="form-control" /></div>
                      <div className="col-4"><label className="form-label">Heure</label>
                        <input name="time" type="time" className="form-control" /></div>
                      <div className="col-4"><label className="form-label">Passagers</label>
                        <input name="passengers" type="number" min="1" defaultValue="2" className="form-control" /></div>
                      <div className="col-6"><label className="form-label">Classe</label>
                        <select name="vehicle" className="form-select">
                          <option value="E">E-Class</option><option value="V">V-Class</option><option value="S">S-Class</option>
                        </select></div>
                      <div className="col-6"><label className="form-label">Montant TTC (€)</label>
                        <input name="amount" type="number" min="0" step="1" className="form-control" /></div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setCreating(false)}>Annuler</button>
                    <button type="submit" className="btn btn-warning">Créer</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
      {view && <DocumentModal doc={view} onClose={() => setView(null)} />}
    </>
  );
}
