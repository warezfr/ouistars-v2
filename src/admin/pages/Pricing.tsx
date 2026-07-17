import { useState } from 'react';
import { ROUTE_RATES, HOURLY_RATES, PER_KM_RATES, MEET_GREET_RATES, PRICE_LIST_VERSION } from '@/data/pricing';
import { supabase } from '@/lib/supabase';
import { listEntries } from '../cms/api';
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

/** Correspondance grille site → route_keys des rate cards ETG (E→business, V→business_van, S→first). */
const ETG_MAP: Record<string, string[]> = {
  'cdg-ory-lbg-paris': ['cdg-paris', 'ory-paris', 'lbg-paris', 'paris-cdg', 'paris-ory'],
  'paris-versailles': ['paris-versailles'],
  'paris-stations': ['gare-nord-paris'],
  'nce-monaco': ['nce-monaco', 'monaco-nce'],
};
const CLASS_TO_ETG: Record<string, string> = { E: 'business', V: 'business_van', S: 'first' };

export default function Pricing() {
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  /** Pousse les prix de la collection « route » vers les rate cards de l'API ETG. */
  async function syncEtg() {
    if (!supabase) { setSyncMsg('Supabase non configuré.'); return; }
    setSyncing(true); setSyncMsg(null);
    try {
      const routes = await listEntries('route');
      let updated = 0, missed = 0;
      for (const r of routes) {
        const d = r.data as { routeId?: string; priceE?: number; priceV?: number; priceS?: number };
        const prefixes = d.routeId ? ETG_MAP[d.routeId] : undefined;
        if (!prefixes) continue;
        for (const prefix of prefixes) {
          for (const [cls, cat] of Object.entries(CLASS_TO_ETG)) {
            const price = d[`price${cls}` as 'priceE'];
            if (price == null) continue;
            const { data: rows, error } = await supabase
              .from('etg_rate_cards')
              .update({ base_price: price })
              .eq('route_key', `${prefix}-${cat === 'business' ? 'business' : cat === 'business_van' ? 'business-van' : 'first'}`)
              .select('id');
            if (error) { missed++; continue; }
            updated += rows?.length ?? 0;
          }
        }
      }
      setSyncMsg(`✓ Synchronisation ETG : ${updated} rate card(s) alignée(s) sur la grille du site.${missed ? ` (${missed} échec(s))` : ''}
        Les trajets sans équivalent ETG (excursions longues, city-to-city) ne sont pas poussés.`);
    } catch (e) {
      setSyncMsg(`Échec : ${(e as Error).message}`);
    } finally {
      setSyncing(false);
    }
  }

  const grouped = ROUTE_RATES.reduce<Record<string, typeof ROUTE_RATES>>((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <div className="alert alert-light border d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <strong>Grille officielle {PRICE_LIST_VERSION}</strong> — source du calculateur, du site et de l’API.
          Prix TTC, par transfert (aller ou retour).
        </div>
        <div className="d-flex gap-2">
          <a className="btn btn-sm btn-warning" href="/admin/content/route">
            <i className="bi bi-pencil me-1" />Éditer les trajets & prix
          </a>
          <a className="btn btn-sm btn-outline-secondary" href="/admin/singleton/rates">
            <i className="bi bi-clock-history me-1" />Tarifs horaires / km
          </a>
          <button className="btn btn-sm btn-dark" onClick={syncEtg} disabled={syncing}
            title="Aligne les prix de l'API partenaire ETG sur la grille du site">
            <i className={`bi ${syncing ? 'bi-hourglass-split' : 'bi-arrow-repeat'} me-1`} />Synchroniser l’API ETG
          </button>
        </div>
      </div>
      {syncMsg && <div className="alert alert-info">{syncMsg}</div>}

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
