import { ROUTE_RATES, HOURLY_RATES, PER_KM_RATES, MEET_GREET_RATES, PRICE_LIST_VERSION } from '@/data/pricing';
import { formatEUR } from '@/lib/pricing';

const CATS: Record<string, string> = {
  airport: 'Aéroports', city: 'Ville', station: 'Gares', tour: 'Excursions',
  riviera: 'Côte d’Azur', 'city-to-city': 'City-to-city',
};

export default function Pricing() {
  const grouped = ROUTE_RATES.reduce<Record<string, typeof ROUTE_RATES>>((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <div className="adm-card">
        <h2>Grille officielle {PRICE_LIST_VERSION} — source du calculateur & des devis</h2>
        <p style={{ color: 'var(--os-mut)', fontSize: '0.85rem' }}>
          Prix TTC, par transfert (aller ou retour). Modifier ici met à jour le calculateur du site et les tarifs proposés.
        </p>
      </div>

      {Object.entries(grouped).map(([cat, rows]) => (
        <div className="adm-card" key={cat}>
          <h2>{CATS[cat] ?? cat}</h2>
          <table className="adm-table">
            <thead><tr><th>Trajet</th><th>E-Class</th><th>V-Class</th><th>S-Class</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.label}</td>
                  <td>{formatEUR(r.prices.E)}</td><td>{formatEUR(r.prices.V)}</td><td>{formatEUR(r.prices.S)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="adm-card">
        <h2>Meet & Greeter (hors véhicule / chauffeur)</h2>
        <table className="adm-table">
          <thead><tr><th>Aéroport</th><th>Base</th><th>Inclus</th><th>Suppl. / pax</th></tr></thead>
          <tbody>
            {MEET_GREET_RATES.map((m) => (
              <tr key={m.id}>
                <td>{m.airport}</td>
                <td>{m.base != null ? formatEUR(m.base) : '—'}</td>
                <td>{m.includedPax} pax / {m.includedBags} bags</td>
                <td>{m.extraPaxSurcharge != null ? formatEUR(m.extraPaxSurcharge) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-card">
        <h2>Horaire (min. 3 h) & au kilomètre</h2>
        <table className="adm-table">
          <thead><tr><th>Base</th><th>E-Class</th><th>V-Class</th><th>S-Class</th></tr></thead>
          <tbody>
            <tr><td>Horaire</td><td>{HOURLY_RATES.E} €/h</td><td>{HOURLY_RATES.V} €/h</td><td>{HOURLY_RATES.S} €/h</td></tr>
            <tr><td>Au km (dès)</td><td>{PER_KM_RATES.E} €/km</td><td>{PER_KM_RATES.V} €/km</td><td>{PER_KM_RATES.S} €/km</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
