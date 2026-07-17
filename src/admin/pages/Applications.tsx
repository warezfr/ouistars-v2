import { useState } from 'react';

type AppStatus = 'new' | 'reviewing' | 'approved' | 'rejected';

interface DriverApplication {
  id: string;
  name: string;
  city: string;
  vtcCard: string;
  languages: string;
  status: AppStatus;
}

const INITIAL: DriverApplication[] = [
  { id: 'CA-1041', name: 'Amadou Diallo', city: 'Paris', vtcCard: 'VTC-075-2214', languages: 'FR, EN', status: 'new' },
  { id: 'CA-1042', name: 'Marek Kowalski', city: 'Paris', vtcCard: 'VTC-075-2287', languages: 'FR, EN, PL', status: 'reviewing' },
  { id: 'CA-1043', name: 'Julie N’Guessan', city: 'Nice', vtcCard: 'VTC-006-0834', languages: 'FR, EN', status: 'new' },
  { id: 'CA-1044', name: 'Luca Fontaine', city: 'Cannes', vtcCard: 'VTC-006-0912', languages: 'FR, EN, IT', status: 'approved' },
  { id: 'CA-1045', name: 'Rachid Benali', city: 'Paris', vtcCard: 'VTC-075-2301', languages: 'FR, EN, AR', status: 'reviewing' },
  { id: 'CA-1046', name: 'Elena Petrova', city: 'Paris', vtcCard: 'VTC-075-2318', languages: 'FR, EN, RU', status: 'rejected' },
];

const STATUS_LABELS: Record<AppStatus, string> = {
  new: 'Nouvelle',
  reviewing: 'En examen',
  approved: 'Approuvée',
  rejected: 'Refusée',
};

const appBadge = (s: AppStatus) =>
  s === 'approved' ? 'adm-badge--ok' : s === 'rejected' ? 'adm-badge--mut' : 'adm-badge--warn';

export default function Applications() {
  const [apps, setApps] = useState<DriverApplication[]>(INITIAL);

  function decide(id: string, status: AppStatus) {
    setApps((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  const pending = apps.filter((a) => a.status === 'new' || a.status === 'reviewing').length;

  return (
    <div className="adm-card">
      <h2>Candidatures chauffeurs</h2>
      <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--os-mut)' }}>
        {pending} candidature{pending > 1 ? 's' : ''} en attente de décision.
      </p>
      <table className="adm-table">
        <thead>
          <tr><th>Réf.</th><th>Nom</th><th>Ville</th><th>Carte VTC</th><th>Langues</th><th>Statut</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id}>
              <td>{a.id}</td><td>{a.name}</td><td>{a.city}</td><td>{a.vtcCard}</td><td>{a.languages}</td>
              <td><span className={`adm-badge ${appBadge(a.status)}`}>{STATUS_LABELS[a.status]}</span></td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                {a.status === 'new' || a.status === 'reviewing' ? (
                  <span style={{ display: 'inline-flex', gap: 8 }}>
                    <button className="adm-btn adm-btn--ok" onClick={() => decide(a.id, 'approved')}>Approuver</button>
                    <button className="adm-btn adm-btn--danger" onClick={() => decide(a.id, 'rejected')}>Refuser</button>
                  </span>
                ) : (
                  <span style={{ color: 'var(--os-mut-2)', fontSize: '0.8rem' }}>Décision prise</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
