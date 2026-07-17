import { useState } from 'react';

type AppStatus = 'new' | 'reviewing' | 'approved' | 'rejected';

interface DriverApplication {
  id: string; name: string; city: string; vtcCard: string; languages: string; status: AppStatus;
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
  new: 'Nouvelle', reviewing: 'En examen', approved: 'Approuvée', rejected: 'Refusée',
};
const appBadge = (s: AppStatus) =>
  s === 'approved' ? 'text-bg-success' : s === 'rejected' ? 'text-bg-secondary' : 'text-bg-warning';

export default function Applications() {
  const [apps, setApps] = useState<DriverApplication[]>(INITIAL);
  const decide = (id: string, status: AppStatus) =>
    setApps((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
  const pending = apps.filter((a) => a.status === 'new' || a.status === 'reviewing').length;

  return (
    <div className="card card-outline card-warning">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">Candidatures chauffeurs</h3>
        <span className="badge text-bg-warning">{pending} en attente</span>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Réf.</th><th>Nom</th><th>Ville</th><th>Carte VTC</th><th>Langues</th><th>Statut</th><th className="text-end pe-3">Actions</th></tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td className="fw-semibold">{a.id}</td><td>{a.name}</td><td>{a.city}</td><td>{a.vtcCard}</td><td>{a.languages}</td>
                  <td><span className={`badge ${appBadge(a.status)}`}>{STATUS_LABELS[a.status]}</span></td>
                  <td className="text-end pe-3 text-nowrap">
                    {a.status === 'new' || a.status === 'reviewing' ? (
                      <>
                        <button className="btn btn-sm btn-success me-1" onClick={() => decide(a.id, 'approved')}>Approuver</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => decide(a.id, 'rejected')}>Refuser</button>
                      </>
                    ) : <span className="text-muted small">Décision prise</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
