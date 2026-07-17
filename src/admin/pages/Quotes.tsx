import { QUOTES, badgeClass } from '../mockData';

export default function Quotes() {
  return (
    <div className="card card-outline card-warning">
      <div className="card-header"><h3 className="card-title mb-0">Devis & Événements</h3></div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Réf.</th><th>Société</th><th>Événement</th><th>Dates</th><th>Véhicules</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {QUOTES.map((q) => (
                <tr key={q.reference}>
                  <td className="fw-semibold">{q.reference}</td><td>{q.company}</td><td>{q.event}</td>
                  <td>{q.dates}</td><td>{q.vehicles}</td>
                  <td><span className={`badge ${badgeClass(q.status)}`}>{q.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
