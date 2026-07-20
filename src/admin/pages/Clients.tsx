import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DataTable, { type Column } from '../ui/DataTable';
import { loadClientDirectory, type DirectoryClient } from '../lib/clients';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';

/**
 * Annuaire clients : fiches réelles (table `clients`, créées automatiquement à
 * l'émission d'un devis/d'une facture ou à la main) fusionnées avec les clients
 * agrégés des réservations (site + API ETG) et des devis.
 */
export default function Clients() {
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);
  const [rows, setRows] = useState<DirectoryClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    if (!supabase) { setError('Supabase non configuré.'); setLoading(false); return; }
    setLoading(true);
    setRows(await loadClientDirectory());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const columns: Column<DirectoryClient>[] = [
    { key: 'name', header: 'Client', value: (r) => r.name,
      render: (r) => (
        <>
          <span className="fw-semibold">{r.name}</span>
          {r.company && <div className="small text-muted">{r.company}</div>}
        </>
      ) },
    { key: 'email', header: 'E-mail', value: (r) => r.email ?? '', render: (r) => r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : '—' },
    { key: 'phone', header: 'Téléphone', value: (r) => r.phone ?? '' },
    { key: 'bookings', header: 'Réservations', value: (r) => r.bookings },
    { key: 'total', header: 'Total', value: (r) => r.total, render: (r) => r.total > 0 ? `${r.total.toFixed(0)} €` : '—' },
    { key: 'lastDate', header: 'Dernière', value: (r) => r.lastDate },
    { key: 'source', header: 'Canaux', filterable: true, sortable: false,
      value: (r) => r.sources.join(', '),
      render: (r) => r.sources.map((sc) => (
        <span key={sc} className={`badge me-1 ${
          sc === 'Fiche' ? 'text-bg-warning' : sc === 'ETG' ? 'text-bg-primary' : sc === 'Devis' ? 'text-bg-info' : 'text-bg-light border'
        }`}>{sc}</span>
      )) },
  ];

  return (
    <div className="card card-outline card-warning">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">Clients <span className="badge text-bg-secondary ms-1">{rows.length}</span></h3>
        {writable && (
          <button className="btn btn-sm btn-warning" onClick={() => setCreating(true)}>
            <i className="bi bi-person-plus me-1" />Nouveau client
          </button>
        )}
      </div>
      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {!loading && !error && (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.key}
            searchPlaceholder="Rechercher nom, société, e-mail, téléphone…"
            empty="Aucun client — ils apparaissent à la première réservation, au premier devis ou via « Nouveau client »." />
        )}
      </div>
      {creating && <NewClientModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}
    </div>
  );
}

/** Création manuelle d'une fiche client. */
function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [f, setF] = useState({ name: '', company: '', email: '', phone: '', address: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  async function save() {
    if (!supabase) return;
    if (!f.name.trim()) { setError('Le nom est requis.'); return; }
    setBusy(true); setError(null);
    const { error } = await supabase.from('clients').insert({
      name: f.name.trim(), company: f.company.trim() || null, email: f.email.trim() || null,
      phone: f.phone.trim() || null, address: f.address.trim() || null, notes: f.notes.trim() || null,
    });
    if (error) {
      setError(/relation|does not exist/i.test(error.message)
        ? 'Table clients absente — exécutez la migration 0009_clients_manual_docs.sql dans Supabase.'
        : /duplicate|unique/i.test(error.message)
          ? 'Une fiche existe déjà avec cet e-mail.'
          : error.message);
      setBusy(false);
      return;
    }
    onCreated();
  }

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal d-block" tabIndex={-1} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header py-2">
              <h5 className="modal-title"><i className="bi bi-person-plus me-2" />Nouveau client</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label small mb-1">Nom *</label>
                  <input className="form-control" value={f.name} onChange={set('name')} autoFocus />
                </div>
                <div className="col-md-6">
                  <label className="form-label small mb-1">Société</label>
                  <input className="form-control" value={f.company} onChange={set('company')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small mb-1">E-mail</label>
                  <input className="form-control" type="email" value={f.email} onChange={set('email')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small mb-1">Téléphone</label>
                  <input className="form-control" value={f.phone} onChange={set('phone')} />
                </div>
                <div className="col-12">
                  <label className="form-label small mb-1">Adresse</label>
                  <input className="form-control" value={f.address} onChange={set('address')} />
                </div>
                <div className="col-12">
                  <label className="form-label small mb-1">Notes</label>
                  <textarea className="form-control" rows={2} value={f.notes} onChange={set('notes')} />
                </div>
              </div>
            </div>
            <div className="modal-footer py-2">
              <button className="btn btn-outline-secondary" onClick={onClose}>Annuler</button>
              <button className="btn btn-warning" disabled={busy} onClick={save}>
                <i className={`bi ${busy ? 'bi-hourglass-split' : 'bi-check-lg'} me-1`} />
                {busy ? 'Enregistrement…' : 'Créer la fiche'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
