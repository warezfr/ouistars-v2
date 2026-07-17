import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { KPIS as DEMO_KPIS, BOOKINGS as DEMO_BOOKINGS, badgeClass } from '../mockData';

const SMALLBOX = ['text-bg-warning', 'text-bg-primary', 'text-bg-success', 'text-bg-secondary'];
const ICONS = ['bi-calendar-check', 'bi-cash-coin', 'bi-envelope-paper', 'bi-person-badge'];

interface Kpi { label: string; value: string }
interface Recent {
  key: string; reference: string; client: string; route: string; date: string;
  vehicle: string; amount: string; status: string; source: string;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<Kpi[]>(DEMO_KPIS);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const [siteCount, etgCount, siteSum, quotesCount, driversCount, siteRecent, etgRecent] = await Promise.all([
        supabase.from('website_bookings').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('etg_orders').select('order_id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('website_bookings').select('price_amount').gte('created_at', since),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).in('status', ['new', 'in_progress', 'sent']),
        supabase.from('cms_entries').select('id', { count: 'exact', head: true }).eq('collection', 'driver').eq('status', 'published'),
        supabase.from('website_bookings').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('etg_orders').select('*').order('created_at', { ascending: false }).limit(3),
      ]);
      if (siteCount.error && etgCount.error) return; // RLS / hors-ligne → démo

      const bookings30 = (siteCount.count ?? 0) + (etgCount.count ?? 0);
      const revenue = (siteSum.data ?? []).reduce((s, r) => s + (r.price_amount != null ? Number(r.price_amount) : 0), 0);
      setKpis([
        { label: 'Réservations (30 j)', value: String(bookings30) },
        { label: 'Volume site (30 j)', value: `${revenue.toFixed(0)} €` },
        { label: 'Devis en cours', value: String(quotesCount.count ?? 0) },
        { label: 'Chauffeurs actifs', value: String(driversCount.count ?? 0) },
      ]);

      const rec: Recent[] = [];
      for (const b of siteRecent.data ?? []) {
        rec.push({
          key: `s-${b.id}`, reference: b.reference,
          client: [b.first_name, b.last_name].filter(Boolean).join(' ') || b.email || '—',
          route: b.prefill || [b.pickup, b.destination].filter(Boolean).join(' → ') || '—',
          date: [b.travel_date, b.travel_time].filter(Boolean).join(' ') || (b.created_at ?? '').slice(0, 10),
          vehicle: b.vehicle_class ?? '—',
          amount: b.price_amount != null ? `${Number(b.price_amount).toFixed(0)} €` : '—',
          status: b.status, source: 'Site',
        });
      }
      for (const o of etgRecent.data ?? []) {
        const mp = (o.main_passenger ?? {}) as { first_name?: string; last_name?: string };
        rec.push({
          key: `e-${o.order_id}`, reference: o.order_id,
          client: [mp.first_name, mp.last_name].filter(Boolean).join(' ') || '—',
          route: `${o.search_payload?.start_point?.iata ?? '—'} → ${o.search_payload?.end_point?.iata ?? o.search_payload?.end_point?.address ?? '—'}`,
          date: (o.start_time ?? '').replace('T', ' ').slice(0, 16),
          vehicle: o.transfer_category ?? '—',
          amount: o.price_amount != null ? `${Number(o.price_amount).toFixed(0)} €` : '—',
          status: o.etg_status === 'cancelled' ? 'cancelled' : (o.workflow_status ?? 'pending'), source: 'ETG',
        });
      }
      if (rec.length) { setRecent(rec); setLive(true); }
    })();
  }, []);

  const shown = recent.length ? recent : DEMO_BOOKINGS.slice(0, 6).map((b) => ({
    key: b.reference, reference: b.reference, client: b.client, route: b.route,
    date: b.date, vehicle: b.vehicle, amount: `${b.amount} €`, status: b.status, source: 'démo',
  }));

  return (
    <>
      <div className="row g-3 mb-2">
        {kpis.map((k, i) => (
          <div key={k.label} className="col-12 col-sm-6 col-lg-3">
            <div className={`small-box ${SMALLBOX[i % SMALLBOX.length]}`}>
              <div className="inner">
                <h3>{k.value}</h3>
                <p>{k.label}</p>
              </div>
              <span className="small-box-icon"><i className={`bi ${ICONS[i % ICONS.length]}`} /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-outline card-warning">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title mb-0">Réservations récentes
            {!live && <span className="badge text-bg-warning ms-2">démo</span>}
          </h3>
          <Link className="btn btn-sm btn-outline-secondary" to="/admin/bookings">Tout voir</Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Réf.</th><th>Source</th><th>Client</th><th>Trajet</th><th>Date</th><th>Véhicule</th><th>Montant</th><th>Statut</th></tr></thead>
              <tbody>
                {shown.map((b) => (
                  <tr key={b.key}>
                    <td className="fw-semibold">{b.reference}</td>
                    <td><span className={`badge ${b.source === 'ETG' ? 'text-bg-primary' : 'text-bg-light border'}`}>{b.source}</span></td>
                    <td>{b.client}</td><td>{b.route}</td><td>{b.date}</td><td>{b.vehicle}</td><td>{b.amount}</td>
                    <td><span className={`badge ${badgeClass(b.status)}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
