import { ROUTE_RATES, HOURLY_RATES, PER_KM_RATES, MEET_GREET_RATES, PRICE_LIST_VERSION } from '@/data/pricing';
import { formatEUR } from '@/lib/pricing';

const CATS: Record<string, string> = {
  airport: 'Aéroports', city: 'Ville', station: 'Gares', tour: 'Excursions',
  riviera: 'Côte d’Azur', 'city-to-city': 'City-to-city',
};

function TableCard({ title, head, children }: { title: string; head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card card-outline card-warning mb-3">
      <div className="card-header"><h3 className="card-title mb-0">{title}</h3></div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr>{head}</tr></thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Pricing() {
  const grouped = ROUTE_RATES.reduce<Record<string, typeof ROUTE_RATES>>((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <div className="alert alert-light border">
        <strong>Grille officielle {PRICE_LIST_VERSION}</strong> — source du calculateur & des devis.
        Prix TTC, par transfert (aller ou retour).
      </div>

      {Object.entries(grouped).map(([cat, rows]) => (
        <TableCard key={cat} title={CATS[cat] ?? cat}
          head={<><th>Trajet</th><th>E-Class</th><th>V-Class</th><th>S-Class</th></>}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="fw-semibold">{r.label}</td>
              <td>{formatEUR(r.prices.E)}</td><td>{formatEUR(r.prices.V)}</td><td>{formatEUR(r.prices.S)}</td>
            </tr>
          ))}
        </TableCard>
      ))}

      <TableCard title="Meet & Greeter (hors véhicule / chauffeur)"
        head={<><th>Aéroport</th><th>Base</th><th>Inclus</th><th>Suppl. / pax</th></>}>
        {MEET_GREET_RATES.map((m) => (
          <tr key={m.id}>
            <td className="fw-semibold">{m.airport}</td>
            <td>{m.base != null ? formatEUR(m.base) : '—'}</td>
            <td>{m.includedPax} pax / {m.includedBags} bags</td>
            <td>{m.extraPaxSurcharge != null ? formatEUR(m.extraPaxSurcharge) : '—'}</td>
          </tr>
        ))}
      </TableCard>

      <TableCard title="Horaire (min. 3 h) & au kilomètre"
        head={<><th>Base</th><th>E-Class</th><th>V-Class</th><th>S-Class</th></>}>
        <tr><td className="fw-semibold">Horaire</td><td>{HOURLY_RATES.E} €/h</td><td>{HOURLY_RATES.V} €/h</td><td>{HOURLY_RATES.S} €/h</td></tr>
        <tr><td className="fw-semibold">Au km (dès)</td><td>{PER_KM_RATES.E} €/km</td><td>{PER_KM_RATES.V} €/km</td><td>{PER_KM_RATES.S} €/km</td></tr>
      </TableCard>
    </>
  );
}
