import { useMemo, useState } from 'react';
import { BOOKINGS, badgeClass } from '../mockData';
import type { Booking } from '../mockData';

type Status = Booking['status'] | 'confirmed';
type Row = Omit<Booking, 'status'> & { status: Status };
type DocType = 'purchase_order' | 'mission_sheet';
type DocState = 'idle' | 'working' | 'done' | 'error';

const DRIVERS = ['P. Martin', 'S. Bernard', 'K. Haddad'];

const STATUS_LABELS: Record<Status, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  assigned: 'Assignée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const TIMELINE: { key: Exclude<Status, 'cancelled'>; label: string }[] = [
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmée' },
  { key: 'assigned', label: 'Assignée' },
  { key: 'completed', label: 'Terminée' },
];

const DOCS: { type: DocType; label: string }[] = [
  { type: 'purchase_order', label: 'Bon de commande' },
  { type: 'mission_sheet', label: 'Fiche de mission' },
];

const IDLE_DOCS: Record<DocType, DocState> = { purchase_order: 'idle', mission_sheet: 'idle' };

export default function Bookings() {
  const [rows, setRows] = useState<Row[]>(() => BOOKINGS.map((b) => ({ ...b })));
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [docStates, setDocStates] = useState<Record<DocType, DocState>>(IDLE_DOCS);

  const selected = useMemo(
    () => rows.find((r) => r.reference === selectedRef) ?? null,
    [rows, selectedRef],
  );

  function open(reference: string) {
    setSelectedRef(reference);
    setDocStates(IDLE_DOCS);
  }

  function patch(reference: string, changes: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.reference === reference ? { ...r, ...changes } : r)));
  }

  function confirm(row: Row) {
    patch(row.reference, { status: row.driver ? 'assigned' : 'confirmed' });
  }

  function assignDriver(row: Row, driver: string) {
    patch(row.reference, {
      driver: driver || undefined,
      status: driver && row.status === 'confirmed' ? 'assigned' : row.status,
    });
  }

  async function download(reference: string, type: DocType) {
    setDocStates((s) => ({ ...s, [type]: 'working' }));
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, type }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${reference}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDocStates((s) => ({ ...s, [type]: 'done' }));
    } catch {
      setDocStates((s) => ({ ...s, [type]: 'error' }));
    }
  }

  const stepIndex = selected ? TIMELINE.findIndex((t) => t.key === selected.status) : -1;
  const showDocs =
    !!selected && !!selected.driver &&
    (selected.status === 'confirmed' || selected.status === 'assigned' || selected.status === 'completed');
  const hasDocError = docStates.purchase_order === 'error' || docStates.mission_sheet === 'error';

  return (
    <>
      <div className="adm-card">
        <h2>Réservations</h2>
        <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--os-mut)' }}>
          Cliquez sur une réservation pour ouvrir le détail, assigner un chauffeur et la confirmer.
        </p>
        <table className="adm-table adm-table--click">
          <thead>
            <tr><th>Réf.</th><th>Client</th><th>Trajet</th><th>Date</th><th>Véhicule</th><th>Chauffeur</th><th>Montant</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr
                key={b.reference}
                className={b.reference === selectedRef ? 'is-selected' : undefined}
                onClick={() => open(b.reference)}
              >
                <td>{b.reference}</td><td>{b.client}</td><td>{b.route}</td><td>{b.date}</td>
                <td>{b.vehicle}</td><td>{b.driver ?? '—'}</td><td>{b.amount} €</td>
                <td><span className={`adm-badge ${badgeClass(b.status)}`}>{STATUS_LABELS[b.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <div className="adm-overlay" onClick={() => setSelectedRef(null)} />
          <aside className="adm-drawer" role="dialog" aria-label={`Réservation ${selected.reference}`}>
            <div className="adm-drawer__head">
              <h2>{selected.reference}</h2>
              <button className="adm-drawer__close" onClick={() => setSelectedRef(null)} aria-label="Fermer">✕</button>
            </div>
            <span className={`adm-badge ${badgeClass(selected.status)}`}>{STATUS_LABELS[selected.status]}</span>

            <div className="adm-drawer__grid">
              <div><div className="adm-info__l">Client</div><div className="adm-info__v">{selected.client}</div></div>
              <div><div className="adm-info__l">Trajet</div><div className="adm-info__v">{selected.route}</div></div>
              <div><div className="adm-info__l">Date & heure</div><div className="adm-info__v">{selected.date}</div></div>
              <div><div className="adm-info__l">Véhicule</div><div className="adm-info__v">Mercedes {selected.vehicle}</div></div>
              <div><div className="adm-info__l">Montant</div><div className="adm-info__v">{selected.amount} €</div></div>
              <div><div className="adm-info__l">Chauffeur</div><div className="adm-info__v">{selected.driver ?? 'Non assigné'}</div></div>
            </div>

            <div className={`adm-tl${selected.status === 'cancelled' ? ' adm-tl--off' : ''}`}>
              {TIMELINE.map((step, i) => (
                <div
                  key={step.key}
                  className={`adm-tl__step${i <= stepIndex ? ' is-done' : ''}${i === stepIndex ? ' is-current' : ''}`}
                >
                  <div className="adm-tl__dot" />
                  <div className="adm-tl__l">{step.label}</div>
                </div>
              ))}
            </div>
            {selected.status === 'cancelled' && (
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--os-danger)' }}>Réservation annulée.</p>
            )}

            <label className="adm-label" htmlFor="bk-driver">Chauffeur assigné</label>
            <select
              id="bk-driver"
              className="adm-input"
              value={selected.driver ?? ''}
              onChange={(e) => assignDriver(selected, e.target.value)}
            >
              <option value="">— Sélectionner un chauffeur —</option>
              {DRIVERS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <div className="adm-drawer__actions">
              <button
                className="adm-btn"
                onClick={() => confirm(selected)}
                disabled={selected.status !== 'pending' && selected.status !== 'confirmed'}
              >
                Confirmer
              </button>
              <button
                className="adm-btn adm-btn--danger"
                onClick={() => patch(selected.reference, { status: 'cancelled' })}
                disabled={selected.status === 'cancelled' || selected.status === 'completed'}
              >
                Annuler
              </button>
            </div>

            {showDocs && (
              <div className="adm-docbox">
                <h3>Documents générés automatiquement</h3>
                <p>Bon de commande + fiche de mission chauffeur ({selected.driver}), envoyés en pièce jointe à la confirmation.</p>
                <div className="adm-docbox__row">
                  {DOCS.map((d) => (
                    <button
                      key={d.type}
                      className="adm-btn adm-btn--ghost"
                      onClick={() => download(selected.reference, d.type)}
                      disabled={docStates[d.type] === 'working'}
                    >
                      {docStates[d.type] === 'working' ? 'Génération…'
                        : docStates[d.type] === 'done' ? `✓ ${d.label}`
                        : `⬇ ${d.label} (PDF)`}
                    </button>
                  ))}
                </div>
                {hasDocError && <div className="adm-docbox__err">API disponible après déploiement</div>}
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
