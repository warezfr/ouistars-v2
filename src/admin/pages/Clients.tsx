import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/** Clients agrégés depuis les réservations (site + API ETG). */
interface ClientRow {
  key: string;
  name: string;
  email?: string;
  phone?: string;
  bookings: number;
  total: number;
  lastDate: string;
  sources: Set<string>;
}

export default function Clients() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      if (!supabase) { setError('Supabase non configuré.'); setLoading(false); return; }
      const map = new Map<string, ClientRow>();
      const add = (name: string, email: string | undefined, phone: string | undefined,
                   amount: number, date: string, source: string) => {
        const key = (email || phone || name).toLowerCase().trim();
        if (!key) return;
        const cur = map.get(key) ?? {
          key, name, email, phone, bookings: 0, total: 0, lastDate: '', sources: new Set<string>(),
        };
        cur.bookings += 1; cur.total += amount; cur.sources.add(source);
        if (date > cur.lastDate) cur.lastDate = date;
        if (!cur.email && email) cur.email = email;
        if (!cur.phone && phone) cur.phone = phone;
        map.set(key, cur);
      };

      const [site, etg] = await Promise.all([
        supabase.from('website_bookings').select('first_name,last_name,email,phone,price_amount,created_at').limit(1000),
        supabase.from('etg_orders').select('main_passenger,price_amount,created_at').limit(1000),
      ]);
      if (site.error && etg.error) { setError(site.error.message); setLoading(false); return; }

      for (const b of site.data ?? []) {
        add([b.first_name, b.last_name].filter(Boolean).join(' ') || b.email || '—',
            b.email ?? undefined, b.phone ?? undefined,
            b.price_amount != null ? Number(b.price_amount) : 0,
            (b.created_at ?? '').slice(0, 10), 'Site');
      }
      for (const o of etg.data ?? []) {
        const mp = (o.main_passenger ?? {}) as { first_name?: string; last_name?: string; phone_number?: string; email?: string };
        add([mp.first_name, mp.last_name].filter(Boolean).join(' ') || '—',
            mp.email, mp.phone_number,
            o.price_amount != null ? Number(o.price_amount) : 0,
            (o.created_at ?? '').slice(0, 10), 'ETG');
      }
      setRows([...map.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate)));
      setLoading(false);
    })();
  }, []);

  const shown = q.trim()
    ? rows.filter((r) => `${r.name} ${r.email ?? ''} ${r.phone ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    : rows;

  return (
    <div className="card card-outline card-warning">
      <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h3 className="card-title mb-0">Clients <span className="badge text-bg-secondary ms-1">{rows.length}</span></h3>
        <input className="form-control form-control-sm" style={{ maxWidth: 260 }}
          placeholder="Rechercher nom, e-mail, téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {!loading && !error && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Client</th><th>E-mail</th><th>Téléphone</th><th>Réservations</th><th>Total</th><th>Dernière</th><th>Canaux</th></tr></thead>
              <tbody>
                {shown.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted py-4">
                    Aucun client — les clients apparaissent automatiquement à la première réservation.
                  </td></tr>
                )}
                {shown.map((r) => (
                  <tr key={r.key}>
                    <td className="fw-semibold">{r.name}</td>
                    <td>{r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : '—'}</td>
                    <td>{r.phone ?? '—'}</td>
                    <td>{r.bookings}</td>
                    <td>{r.total > 0 ? `${r.total.toFixed(0)} €` : '—'}</td>
                    <td>{r.lastDate || '—'}</td>
                    <td>{[...r.sources].map((s) => (
                      <span key={s} className={`badge me-1 ${s === 'ETG' ? 'text-bg-primary' : 'text-bg-light border'}`}>{s}</span>
                    ))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
