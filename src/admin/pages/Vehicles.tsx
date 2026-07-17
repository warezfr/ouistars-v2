import { FLEET } from '@/data/fleet';

export default function Vehicles() {
  return (
    <div className="card card-outline card-warning">
      <div className="card-header"><h3 className="card-title mb-0">Flotte</h3></div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>Modèle</th><th>Classe</th><th>Catégorie</th><th>Places</th><th>Bagages</th></tr></thead>
            <tbody>
              {FLEET.map((v) => (
                <tr key={v.id}>
                  <td className="fw-semibold">{v.name}</td>
                  <td><span className="badge text-bg-secondary">{v.className}</span></td>
                  <td>{v.category}</td><td>{v.seats}</td><td>{v.luggage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
