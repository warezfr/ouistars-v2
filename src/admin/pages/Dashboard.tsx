import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChart, DonutChart, BarChart } from '../ui/Charts';

/** Classe de badge Bootstrap (AdminLTE) selon le statut. */
const badgeClass = (s: string) =>
  s === 'completed' || s === 'accepted' || s === 'invoiced' || s === 'active' ? 'text-bg-success'
  : s === 'cancelled' || s === 'rejected' ? 'text-bg-secondary'
  : 'text-bg-warning';

const SMALLBOX = ['text-bg-warning', 'text-bg-primary', 'text-bg-success', 'text-bg-secondary'];
const ICONS = ['bi-calendar-check', 'bi-cash-coin', 'bi-envelope-paper', 'bi-person-badge'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', assigned: 'Assignée', completed: 'Terminée', cancelled: 'Annulée',
};

interface Kpi { label: string; value: string }
interface Recent { key: string; reference: string; client: string; route: string; date: string; vehicle: string; amount: string; status: string; source: string }
interface Series { day: string; revenue: number; count: number }

export default function Dashboard() {
  const [kpis, setKpis] = useState<Kpi[]>([
    { label: 'Courses (30 j)', value: '—' },
    { label: 'Volume (30 j)', value: '—' },
    { label: 'Devis en cours', value: '—' },
    { label: 'Chauffeurs actifs', value: '—' },
  ]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [live, setLive] = useState(false);
  const [series, setSeries] = useState<Series[]>([]);
  const [byStatus, setByStatus] = useState<{ label: string; value: number }[]>([]);
  const [byChannel, setByChannel] = useState<{ label: string; value: number }[]>([]);
  const [byClass, setByClass] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const since = new Date(Date.now() - 30 * 864e5);
      const sinceIso = since.toISOString();
      const [siteCount, etgCount, quotesCount, driversCount, siteRows, etgRows] = await Promise.all([
        supabase.from('website_bookings').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso),
        supabase.from('etg_orders').select('order_id', { count: 'exact', head: true }).gte('created_at', sinceIso),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).in('status', ['new', 'in_progress', 'sent']),
        supabase.from('cms_entries').select('id', { count: 'exact', head: true }).eq('collection', 'driver').eq('status', 'published'),
        supabase.from('website_bookings').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('etg_orders').select('*').order('created_at', { ascending: false }).limit(500),
      ]);
      if (siteCount.error && etgCount.error) return;

      const site = siteRows.data ?? [];
      const etg = etgRows.data ?? [];
      const revenue = site.reduce((s, r) => s + (r.price_amount != null ? Number(r.price_amount) : 0), 0)
        + etg.reduce((s, r) => s + (r.price_amount != null ? Number(r.price_amount) : 0), 0);

      setKpis([
        { label: 'Réservations (30 j)', value: String((siteCount.count ?? 0) + (etgCount.count ?? 0)) },
        { label: 'Volume (30 j)', value: `${revenue.toFixed(0)} €` },
        { label: 'Devis en cours', value: String(quotesCount.count ?? 0) },
        { label: 'Chauffeurs actifs', value: String(driversCount.count ?? 0) },
      ]);

      // Série 30 jours (CA + nb) sur les réservations site
      const days: Series[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
        days.push({ day: d, revenue: 0, count: 0 });
      }
      const idx = new Map(days.map((d, i) => [d.day, i]));
      for (const r of site) {
        const k = (r.created_at ?? '').slice(0, 10);
        const i = idx.get(k);
        if (i != null) { days[i].count += 1; days[i].revenue += r.price_amount != null ? Number(r.price_amount) : 0; }
      }
      setSeries(days);

      // Répartitions
      const count = (arr: string[]) => {
        const m = new Map<string, number>();
        for (const v of arr) if (v) m.set(v, (m.get(v) ?? 0) + 1);
        return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
      };
      setByStatus(count([
        ...site.map((r) => STATUS_LABELS[r.status] ?? r.status),
        ...etg.map((r) => r.etg_status === 'cancelled' ? 'Annulée' : STATUS_LABELS[r.workflow_status ?? 'pending'] ?? 'En attente'),
      ]));
      setByChannel(count([...site.map((r) => r.channel || 'siteweb'), ...etg.map(() => 'API ETG')]));
      setByClass(count([
        ...site.map((r) => r.vehicle_class ? `Classe ${r.vehicle_class}` : '').filter(Boolean),
        ...etg.map((r) => r.transfer_category ? 'ETG ' + r.transfer_category : '').filter(Boolean),
      ]).slice(0, 6));

      // Récentes
      const rec: Recent[] = [];
      for (const b of site.slice(0, 4)) rec.push({
        key: `s-${b.id}`, reference: b.reference,
        client: [b.first_name, b.last_name].filter(Boolean).join(' ') || b.email || '—',
        route: b.prefill || [b.pickup, b.destination].filter(Boolean).join(' → ') || '—',
        date: [b.travel_date, b.travel_time].filter(Boolean).join(' ') || (b.created_at ?? '').slice(0, 10),
        vehicle: b.vehicle_class ?? '—',
        amount: b.price_amount != null ? `${Number(b.price_amount).toFixed(0)} €` : '—',
        status: b.status, source: 'Site',
      });
      for (const o of etg.slice(0, 3)) {
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

  const shown = recent;   // données réelles uniquement (plus de démo)
  const weekRevenue = series.slice(-7).reduce((s, d) => s + d.revenue, 0);
  const labels = series.map((d) => d.day.slice(5));

  return (
    <>
      <div className="row g-3 mb-2">
        {kpis.map((k, i) => (
          <div key={k.label} className="col-12 col-sm-6 col-lg-3">
            <div className={`small-box ${SMALLBOX[i % SMALLBOX.length]}`}>
              <div className="inner"><h3>{k.value}</h3><p>{k.label}</p></div>
              <span className="small-box-icon"><i className={`bi ${ICONS[i % ICONS.length]}`} /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card card-outline card-warning h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title mb-0">Activité — 30 jours</h3>
              <span className="text-muted small">7 derniers jours : <strong>{weekRevenue.toFixed(0)} €</strong></span>
            </div>
            <div className="card-body">
              {series.length ? <AreaChart points={series.map((d) => d.revenue)} labels={labels} unit=" €" />
                : <p className="text-muted mb-0">Données indisponibles (base non connectée).</p>}
              <div className="text-muted small text-center mt-1">Chiffre d’affaires quotidien (réservations site)</div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card card-outline card-secondary h-100">
            <div className="card-header"><h3 className="card-title mb-0">Par statut</h3></div>
            <div className="card-body">
              {byStatus.length ? <DonutChart data={byStatus} /> : <p className="text-muted mb-0">—</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-0">
        <div className="col-lg-6">
          <div className="card card-outline card-secondary">
            <div className="card-header"><h3 className="card-title mb-0">Par canal d’acquisition</h3></div>
            <div className="card-body">{byChannel.length ? <DonutChart data={byChannel} size={150} /> : <p className="text-muted mb-0">—</p>}</div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card card-outline card-secondary">
            <div className="card-header"><h3 className="card-title mb-0">Par classe de véhicule</h3></div>
            <div className="card-body text-body">{byClass.length ? <BarChart data={byClass} /> : <p className="text-muted mb-0">—</p>}</div>
          </div>
        </div>
      </div>

      <div className="card card-outline card-warning mt-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title mb-0">Activité récente</h3>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Réf.</th><th>Source</th><th>Client</th><th>Trajet</th><th>Date</th><th>Véhicule</th><th>Montant</th><th>Statut</th></tr></thead>
              <tbody>
                {shown.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-muted py-4">Aucune activité récente.</td></tr>
                )}
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
