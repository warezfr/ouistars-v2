import { useState } from 'react';
import { BOOKINGS } from '../mockData';

type DocType = 'purchase_order' | 'mission_sheet';

const HISTORY = [
  { date: '2026-07-15 10:42', type: 'Bon de commande', ref: 'OS-8F2K1A', driver: 'P. Martin', sent: true },
  { date: '2026-07-15 10:42', type: 'Fiche de mission', ref: 'OS-8F2K1A', driver: 'P. Martin', sent: true },
  { date: '2026-07-14 16:05', type: 'Fiche de mission', ref: 'OS-5X1L7D', driver: 'S. Bernard', sent: true },
  { date: '2026-07-14 16:05', type: 'Bon de commande', ref: 'OS-5X1L7D', driver: 'S. Bernard', sent: false },
  { date: '2026-07-12 11:31', type: 'Fiche de mission', ref: 'OS-2M8P4E', driver: 'P. Martin', sent: true },
];

export default function Documents() {
  const [ref, setRef] = useState(BOOKINGS[0].reference);
  const [type, setType] = useState<DocType>('mission_sheet');
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');

  async function generate() {
    setStatus('working');
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref, type }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${type}-${ref}.pdf`; a.click();
      URL.revokeObjectURL(url);
      setStatus('done');
    } catch { setStatus('error'); }
  }

  return (
    <div className="row g-3">
      <div className="col-lg-7">
        <div className="card card-outline card-warning">
          <div className="card-header"><h3 className="card-title mb-0">Historique des documents générés</h3></div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead><tr><th>Date</th><th>Type</th><th>Réf.</th><th>Chauffeur</th><th>Statut</th></tr></thead>
                <tbody>
                  {HISTORY.map((h, i) => (
                    <tr key={i}>
                      <td>{h.date}</td><td>{h.type}</td><td>{h.ref}</td><td>{h.driver}</td>
                      <td><span className={`badge ${h.sent ? 'text-bg-success' : 'text-bg-warning'}`}>{h.sent ? 'Envoyé' : 'En attente'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-5">
        <div className="card card-outline card-secondary">
          <div className="card-header"><h3 className="card-title mb-0">Générer un document</h3></div>
          <div className="card-body">
            <p className="text-muted small">
              À la confirmation d’une réservation, le bon de commande et la fiche de mission (PDF nominatif)
              sont générés et envoyés automatiquement au chauffeur. Génération manuelle ci-dessous.
            </p>
            <div className="mb-3">
              <label className="form-label">Réservation</label>
              <select className="form-select" value={ref} onChange={(e) => setRef(e.target.value)}>
                {BOOKINGS.map((b) => <option key={b.reference} value={b.reference}>{b.reference} — {b.client} — {b.route}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Type de document</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value as DocType)}>
                <option value="mission_sheet">Fiche de mission (chauffeur)</option>
                <option value="purchase_order">Bon de commande</option>
              </select>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-warning" onClick={generate} disabled={status === 'working'}>
                <i className="bi bi-file-earmark-pdf me-1" />{status === 'working' ? 'Génération…' : 'Générer le PDF'}
              </button>
              {status === 'done' && <span className="text-success">✓ Généré</span>}
              {status === 'error' && <span className="text-danger small">API non disponible en preview</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
