import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DataTable, { type Column } from '../ui/DataTable';

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

  const columns: Column<ClientRow>[] = [
    { key: 'name', header: 'Client', value: (r) => r.name, render: (r) => <span className="fw-semibold">{r.name}</span> },
    { key: 'email', header: 'E-mail', value: (r) => r.email ?? '', render: (r) => r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : '—' },
    { key: 'phone', header: 'Téléphone', value: (r) => r.phone ?? '' },
    { key: 'bookings', header: 'Réservations', value: (r) => r.bookings },
    { key: 'total', header: 'Total', value: (r) => r.total, render: (r) => r.total > 0 ? `${r.total.toFixed(0)} €` : '—' },
    { key: 'lastDate', header: 'Dernière', value: (r) => r.lastDate },
    { key: 'source', header: 'Canaux', filterable: true, sortable: false,
      value: (r) => [...r.sources].join(', '),
      render: (r) => [...r.sources].map((sc) => (
        <span key={sc} className={`badge me-1 ${sc === 'ETG' ? 'text-bg-primary' : 'text-bg-light border'}`}>{sc}</span>
      )) },
  ];

  return (
    <div className="card card-outline card-warning">
      <div className="card-header">
        <h3 className="card-title mb-0">Clients <span className="badge text-bg-secondary ms-1">{rows.length}</span></h3>
      </div>
      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {!loading && !error && (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.key}
            searchPlaceholder="Rechercher nom, e-mail, téléphone…"
            empty="Aucun client — ils apparaissent à la première réservation." />
        )}
      </div>
    </div>
  );
}
