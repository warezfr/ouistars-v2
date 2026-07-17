import { useMemo, useState } from 'react';
import { BOOKINGS, badgeClass } from '../mockData';
import type { Booking } from '../mockData';

type Status = Booking['status'] | 'confirmed';
type Row = Omit<Booking, 'status'> & { status: Status };
type DocType = 'purchase_order' | 'mission_sheet';
type DocState = 'idle' | 'working' | 'done' | 'error';

const DRIVERS = ['P. Martin', 'S. Bernard', 'K. Haddad'];
const STATUS_LABELS: Record<Status, string> = {
  pending: 'En attente', confirmed: 'Confirmée', assigned: 'Assignée', completed: 'Terminée', cancelled: 'Annulée',
};
const TIMELINE: { key: Exclude<Status, 'cancelled'>; label: string }[] = [
  { key: 'pending', label: 'En attente' }, { key: 'confirmed', label: 'Confirmée' },
  { key: 'assigned', label: 'Assignée' }, { key: 'completed', label: 'Terminée' },
];
const DOCS: { type: DocType; label: string }[] = [
  { type: 'purchase_order', label: 'Bon de commande' }, { type: 'mission_sheet', label: 'Fiche de mission' },
];
const IDLE_DOCS: Record<DocType, DocState> = { purchase_order: 'idle', mission_sheet: 'idle' };

export default function Bookings() {
  const [rows, setRows] = useState<Row[]>(() => BOOKINGS.map((b) => ({ ...b })));
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [docStates, setDocStates] = useState<Record<DocType, DocState>>(IDLE_DOCS);
  const selected = useMemo(() => rows.find((r) => r.reference === selectedRef) ?? null, [rows, selectedRef]);

  const open = (reference: string) => { setSelectedRef(reference); setDocStates(IDLE_DOCS); };
  const patch = (reference: string, changes: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.reference === reference ? { ...r, ...changes } : r)));
  const confirm = (row: Row) => patch(row.reference, { status: row.driver ? 'assigned' : 'confirmed' });
  const assignDriver = (row: Row, driver: string) =>
    patch(row.reference, { driver: driver || undefined, status: driver && row.status === 'confirmed' ? 'assigned' : row.status });

  async function download(reference: string, type: DocType) {
    setDocStates((s) => ({ ...s, [type]: 'working' }));
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, type }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${type}-${reference}.pdf`; a.click();
      URL.revokeObjectURL(url);
      setDocStates((s) => ({ ...s, [type]: 'done' }));
    } catch { setDocStates((s) => ({ ...s, [type]: 'error' })); }
  }

  const stepIndex = selected ? TIMELINE.findIndex((t) => t.key === selected.status) : -1;
  const showDocs = !!selected && !!selected.driver &&
    (selected.status === 'confirmed' || selected.status === 'assigned' || selected.status === 'completed');

  return (
    <>
      <div className="card card-outline card-warning">
        <div className="card-header"><h3 className="card-title mb-0">Réservations</h3>
          <div className="card-tools text-muted small">Cliquez une ligne pour ouvrir le détail</div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ cursor: 'pointer' }}>
              <thead><tr><th>Réf.</th><th>Client</th><th>Trajet</th><th>Date</th><th>Véhicule</th><th>Chauffeur</th><th>Montant</th><th>Statut</th></tr></thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.reference} className={b.reference === selectedRef ? 'table-active' : undefined} onClick={() => open(b.reference)}>
                    <td className="fw-semibold">{b.reference}</td><td>{b.client}</td><td>{b.route}</td><td>{b.date}</td>
                    <td>{b.vehicle}</td><td>{b.driver ?? '—'}</td><td>{b.amount} €</td>
                    <td><span className={`badge ${badgeClass(b.status)}`}>{STATUS_LABELS[b.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <>
          <div className="offcanvas-backdrop fade show" onClick={() => setSelectedRef(null)} />
          <div className="offcanvas offcanvas-end show" tabIndex={-1} style={{ visibility: 'visible', width: 'min(460px, 92vw)' }}>
            <div className="offcanvas-header border-bottom">
              <h5 className="offcanvas-title">{selected.reference}
                <span className={`badge ms-2 ${badgeClass(selected.status)}`}>{STATUS_LABELS[selected.status]}</span>
              </h5>
              <button type="button" className="btn-close" onClick={() => setSelectedRef(null)} />
            </div>
            <div className="offcanvas-body">
              <dl className="row mb-3">
                <dt className="col-5 text-muted fw-normal">Client</dt><dd className="col-7">{selected.client}</dd>
                <dt className="col-5 text-muted fw-normal">Trajet</dt><dd className="col-7">{selected.route}</dd>
                <dt className="col-5 text-muted fw-normal">Date & heure</dt><dd className="col-7">{selected.date}</dd>
                <dt className="col-5 text-muted fw-normal">Véhicule</dt><dd className="col-7">Mercedes {selected.vehicle}</dd>
                <dt className="col-5 text-muted fw-normal">Montant</dt><dd className="col-7">{selected.amount} €</dd>
                <dt className="col-5 text-muted fw-normal">Chauffeur</dt><dd className="col-7">{selected.driver ?? 'Non assigné'}</dd>
              </dl>

              <ul className="list-group list-group-horizontal mb-3 small text-center flex-wrap">
                {TIMELINE.map((step, i) => (
                  <li key={step.key} className={`list-group-item flex-fill ${i <= stepIndex ? 'list-group-item-warning' : ''}`}>
                    {step.label}
                  </li>
                ))}
              </ul>
              {selected.status === 'cancelled' && <div className="alert alert-secondary py-2">Réservation annulée.</div>}

              <label className="form-label">Chauffeur assigné</label>
              <select className="form-select mb-3" value={selected.driver ?? ''} onChange={(e) => assignDriver(selected, e.target.value)}>
                <option value="">— Sélectionner un chauffeur —</option>
                {DRIVERS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              <div className="d-flex gap-2 mb-3">
                <button className="btn btn-warning flex-fill" onClick={() => confirm(selected)}
                  disabled={selected.status !== 'pending' && selected.status !== 'confirmed'}>Confirmer</button>
                <button className="btn btn-outline-danger flex-fill" onClick={() => patch(selected.reference, { status: 'cancelled' })}
                  disabled={selected.status === 'cancelled' || selected.status === 'completed'}>Annuler</button>
              </div>

              {showDocs && (
                <div className="card bg-body-tertiary">
                  <div className="card-body">
                    <h6 className="card-title">Documents chauffeur ({selected.driver})</h6>
                    <p className="text-muted small">Bon de commande + fiche de mission, envoyés à la confirmation.</p>
                    <div className="d-flex gap-2 flex-wrap">
                      {DOCS.map((d) => (
                        <button key={d.type} className="btn btn-sm btn-outline-secondary" onClick={() => download(selected.reference, d.type)}
                          disabled={docStates[d.type] === 'working'}>
                          {docStates[d.type] === 'working' ? 'Génération…' : docStates[d.type] === 'done' ? `✓ ${d.label}` : `⬇ ${d.label}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
