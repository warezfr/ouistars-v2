const DRIVERS = [
  { name: 'Pierre Martin', phone: '+33 6 98 76 54 32', langs: 'FR, EN', vtc: 'VTC-0012', status: 'active' },
  { name: 'Sophie Bernard', phone: '+33 6 87 65 43 21', langs: 'FR, EN, DE', vtc: 'VTC-0031', status: 'active' },
  { name: 'Karim Haddad', phone: '+33 6 12 34 56 78', langs: 'FR, EN, AR', vtc: 'VTC-0045', status: 'on_mission' },
];

export default function Drivers() {
  return (
    <div className="adm-card">
      <h2>Chauffeurs</h2>
      <table className="adm-table">
        <thead><tr><th>Nom</th><th>Téléphone</th><th>Langues</th><th>Carte VTC</th><th>Statut</th></tr></thead>
        <tbody>
          {DRIVERS.map((d) => (
            <tr key={d.vtc}>
              <td>{d.name}</td><td>{d.phone}</td><td>{d.langs}</td><td>{d.vtc}</td>
              <td><span className={`adm-badge ${d.status === 'active' ? 'adm-badge--ok' : 'adm-badge--warn'}`}>{d.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
