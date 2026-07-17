import { useState } from 'react';
import { BOOKINGS } from '../mockData';

type DocType = 'purchase_order' | 'mission_sheet';

/** Historique mock des documents générés (remplacé par Supabase en production). */
const HISTORY = [
  { date: '2026-07-15 10:42', type: 'Bon de commande', ref: 'OS-8F2K1A', driver: 'P. Martin', sent: true },
  { date: '2026-07-15 10:42', type: 'Fiche de mission', ref: 'OS-8F2K1A', driver: 'P. Martin', sent: true },
  { date: '2026-07-14 16:05', type: 'Fiche de mission', ref: 'OS-5X1L7D', driver: 'S. Bernard', sent: true },
  { date: '2026-07-14 16:05', type: 'Bon de commande', ref: 'OS-5X1L7D', driver: 'S. Bernard', sent: false },
  { date: '2026-07-12 11:31', type: 'Fiche de mission', ref: 'OS-2M8P4E', driver: 'P. Martin', sent: true },
];

/**
 * Génération des documents chauffeurs (consigne) :
 * - bon de commande
 * - fiche de mission (PDF nominatif par chauffeur, en pièce jointe à la confirmation)
 * Appelle l'endpoint `api/documents/generate` (pdfkit + Supabase Storage).
 */
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
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <div className="adm-card">
        <h2>Historique des documents générés</h2>
        <table className="adm-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Réf. réservation</th><th>Chauffeur</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {HISTORY.map((h, i) => (
              <tr key={i}>
                <td>{h.date}</td><td>{h.type}</td><td>{h.ref}</td><td>{h.driver}</td>
                <td>
                  <span className={`adm-badge ${h.sent ? 'adm-badge--ok' : 'adm-badge--warn'}`}>
                    {h.sent ? 'Envoyé' : 'En attente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-card" style={{ maxWidth: 640 }}>
      <h2>Documents chauffeurs</h2>
      <p style={{ color: 'var(--os-mut)', fontSize: '0.88rem' }}>
        À la confirmation d’une réservation, le bon de commande et la fiche de mission (PDF nominatif)
        sont générés et envoyés automatiquement au chauffeur en pièce jointe. Génération manuelle ci-dessous.
      </p>

      <label style={{ display: 'block', margin: '16px 0 6px', fontSize: '0.8rem', color: 'var(--os-mut)' }}>Réservation</label>
      <select value={ref} onChange={(e) => setRef(e.target.value)}
        style={{ width: '100%', padding: 12, background: '#0c0e13', color: 'var(--os-ivory)', border: '1px solid var(--os-line)', borderRadius: 8 }}>
        {BOOKINGS.map((b) => <option key={b.reference} value={b.reference}>{b.reference} — {b.client} — {b.route}</option>)}
      </select>

      <label style={{ display: 'block', margin: '16px 0 6px', fontSize: '0.8rem', color: 'var(--os-mut)' }}>Type de document</label>
      <select value={type} onChange={(e) => setType(e.target.value as DocType)}
        style={{ width: '100%', padding: 12, background: '#0c0e13', color: 'var(--os-ivory)', border: '1px solid var(--os-line)', borderRadius: 8 }}>
        <option value="mission_sheet">Fiche de mission (chauffeur)</option>
        <option value="purchase_order">Bon de commande</option>
      </select>

      <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="adm-btn" onClick={generate} disabled={status === 'working'}>
          {status === 'working' ? 'Génération…' : 'Générer le PDF'}
        </button>
        {status === 'done' && <span style={{ color: 'var(--os-success)' }}>✓ Généré</span>}
        {status === 'error' && <span style={{ color: 'var(--os-danger)' }}>API non disponible en preview (voir docs/API.md)</span>}
      </div>
      </div>
    </>
  );
}
