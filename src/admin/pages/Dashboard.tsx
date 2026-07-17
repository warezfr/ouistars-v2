import { KPIS, BOOKINGS, badgeClass } from '../mockData';

/** Courses par jour sur 30 jours (mock). */
const ACTIVITY = [5, 7, 4, 8, 6, 9, 7, 5, 6, 10, 8, 6, 7, 9, 6, 4, 8, 11, 7, 5, 9, 6, 8, 10, 7, 12, 9, 6, 8, 11];
const ACTIVITY_MAX = Math.max(...ACTIVITY);

/** Répartition des courses par classe de véhicule (mock, %). */
const CLASSES = [
  { label: 'E-Class', pct: 38 },
  { label: 'V-Class', pct: 27 },
  { label: 'S-Class', pct: 35 },
];

export default function Dashboard() {
  return (
    <>
      <div className="adm-kpis">
        {KPIS.map((k) => (
          <div key={k.label} className="adm-kpi">
            <div className="adm-kpi__v">{k.value}</div>
            <div className="adm-kpi__l">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="adm-charts">
        <div className="adm-card">
          <h2>Activité 30 jours</h2>
          <div className="adm-bars" role="img" aria-label="Courses par jour sur les 30 derniers jours">
            {ACTIVITY.map((v, i) => (
              <span
                key={i}
                style={{ height: `${Math.round((v / ACTIVITY_MAX) * 100)}%` }}
                title={`J-${ACTIVITY.length - i} · ${v} courses`}
              />
            ))}
          </div>
          <div className="adm-bars__axis"><span>J-30</span><span>J-15</span><span>Aujourd’hui</span></div>
        </div>

        <div className="adm-card">
          <h2>Répartition par classe</h2>
          <div className="adm-hbars">
            {CLASSES.map((c) => (
              <div key={c.label}>
                <div className="adm-hbar__top"><strong>{c.label}</strong><span>{c.pct} %</span></div>
                <div className="adm-hbar__track">
                  <div className="adm-hbar__fill" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="adm-card">
        <h2>Réservations récentes</h2>
        <table className="adm-table">
          <thead>
            <tr><th>Réf.</th><th>Client</th><th>Trajet</th><th>Date</th><th>Véhicule</th><th>Montant</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {BOOKINGS.slice(0, 5).map((b) => (
              <tr key={b.reference}>
                <td>{b.reference}</td><td>{b.client}</td><td>{b.route}</td><td>{b.date}</td>
                <td>{b.vehicle}</td><td>{b.amount} €</td>
                <td><span className={`adm-badge ${badgeClass(b.status)}`}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
