import { FLEET } from '@/data/fleet';

export default function Vehicles() {
  return (
    <div className="adm-card">
      <h2>Flotte</h2>
      <table className="adm-table">
        <thead><tr><th>Modèle</th><th>Classe</th><th>Catégorie</th><th>Places</th><th>Bagages</th></tr></thead>
        <tbody>
          {FLEET.map((v) => (
            <tr key={v.id}>
              <td>{v.name}</td>
              <td><span className="adm-badge adm-badge--mut">{v.className}</span></td>
              <td>{v.category}</td><td>{v.seats}</td><td>{v.luggage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
