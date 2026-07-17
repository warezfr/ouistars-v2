import { QUOTES, badgeClass } from '../mockData';

export default function Quotes() {
  return (
    <div className="adm-card">
      <h2>Devis & Événements</h2>
      <table className="adm-table">
        <thead>
          <tr><th>Réf.</th><th>Société</th><th>Événement</th><th>Dates</th><th>Véhicules</th><th>Statut</th></tr>
        </thead>
        <tbody>
          {QUOTES.map((q) => (
            <tr key={q.reference}>
              <td>{q.reference}</td><td>{q.company}</td><td>{q.event}</td><td>{q.dates}</td>
              <td>{q.vehicles}</td>
              <td><span className={`adm-badge ${badgeClass(q.status)}`}>{q.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
