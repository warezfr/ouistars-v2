const DRIVERS = [
  { name: 'Pierre Martin', phone: '+33 6 98 76 54 32', langs: 'FR, EN', vtc: 'VTC-0012', status: 'active' },
  { name: 'Sophie Bernard', phone: '+33 6 87 65 43 21', langs: 'FR, EN, DE', vtc: 'VTC-0031', status: 'active' },
  { name: 'Karim Haddad', phone: '+33 6 12 34 56 78', langs: 'FR, EN, AR', vtc: 'VTC-0045', status: 'on_mission' },
];

export default function Drivers() {
  return (
    <div className="card card-outline card-warning">
      <div className="card-header"><h3 className="card-title mb-0">Chauffeurs</h3></div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>Nom</th><th>Téléphone</th><th>Langues</th><th>Carte VTC</th><th>Statut</th></tr></thead>
            <tbody>
              {DRIVERS.map((d) => (
                <tr key={d.vtc}>
                  <td className="fw-semibold">{d.name}</td><td>{d.phone}</td><td>{d.langs}</td><td>{d.vtc}</td>
                  <td><span className={`badge ${d.status === 'active' ? 'text-bg-success' : 'text-bg-warning'}`}>
                    {d.status === 'active' ? 'Actif' : 'En mission'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
