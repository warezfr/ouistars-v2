import { KPIS, BOOKINGS, badgeClass } from '../mockData';

const SMALLBOX = ['text-bg-warning', 'text-bg-primary', 'text-bg-success', 'text-bg-secondary'];
const ICONS = ['bi-calendar-check', 'bi-cash-coin', 'bi-people', 'bi-truck-front'];

const bsBadge = (s: string) => {
  const c = badgeClass(s);
  if (c.includes('ok')) return 'text-bg-success';
  if (c.includes('warn')) return 'text-bg-warning';
  return 'text-bg-secondary';
};

export default function Dashboard() {
  return (
    <>
      <div className="row g-3 mb-2">
        {KPIS.map((k, i) => (
          <div key={k.label} className="col-12 col-sm-6 col-lg-3">
            <div className={`small-box ${SMALLBOX[i % SMALLBOX.length]}`}>
              <div className="inner">
                <h3>{k.value}</h3>
                <p>{k.label}</p>
              </div>
              <span className="small-box-icon"><i className={`bi ${ICONS[i % ICONS.length]}`} /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-outline card-warning">
        <div className="card-header"><h3 className="card-title mb-0">Réservations récentes</h3></div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr><th>Réf.</th><th>Client</th><th>Trajet</th><th>Date</th><th>Véhicule</th><th>Montant</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {BOOKINGS.slice(0, 6).map((b) => (
                  <tr key={b.reference}>
                    <td className="fw-semibold">{b.reference}</td>
                    <td>{b.client}</td><td>{b.route}</td><td>{b.date}</td><td>{b.vehicle}</td>
                    <td>{b.amount} €</td>
                    <td><span className={`badge ${bsBadge(b.status)}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
