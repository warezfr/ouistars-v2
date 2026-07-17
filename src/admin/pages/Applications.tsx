import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createEntry } from '../cms/api';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';
import DataTable, { type Column } from '../ui/DataTable';

/**
 * Candidatures chauffeurs (table chauffeur_applications).
 * « Approuver » crée automatiquement la fiche Chauffeur correspondante.
 */
interface Row {
  id: string; reference: string; name: string; firstName?: string; lastName?: string;
  city?: string; vtcCard?: string; phone?: string; email?: string; message?: string;
  status: string; demo?: boolean;
}

const DEMO: Row[] = [
  { id: 'd1', reference: 'CA-1041', name: 'Amadou Diallo', city: 'Paris', vtcCard: 'VTC-075-2214', status: 'new', demo: true },
  { id: 'd2', reference: 'CA-1042', name: 'Marek Kowalski', city: 'Paris', vtcCard: 'VTC-075-2287', status: 'reviewing', demo: true },
  { id: 'd3', reference: 'CA-1043', name: 'Julie N’Guessan', city: 'Nice', vtcCard: 'VTC-006-0834', status: 'new', demo: true },
];

const LABELS: Record<string, string> = {
  new: 'Nouvelle', reviewing: 'En examen', approved: 'Approuvée', rejected: 'Refusée',
};
const badge = (s: string) =>
  s === 'approved' ? 'text-bg-success' : s === 'rejected' ? 'text-bg-secondary' : 'text-bg-warning';

export default function Applications() {
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    if (supabase) {
      const { data, error } = await supabase.from('chauffeur_applications').select('*')
        .order('created_at', { ascending: false }).limit(200);
      if (!error && data && data.length > 0) {
        setRows(data.map((a) => ({
          id: a.id, reference: a.reference,
          name: [a.first_name, a.last_name].filter(Boolean).join(' ') || a.email || '—',
          firstName: a.first_name ?? undefined, lastName: a.last_name ?? undefined,
          city: a.city ?? undefined, vtcCard: a.vtc_card ?? undefined,
          phone: a.phone ?? undefined, email: a.email ?? undefined,
          message: a.message ?? undefined, status: a.status,
        })));
        setLoading(false);
        return;
      }
      if (error) setError(error.message);
    }
    setRows(DEMO);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function decide(r: Row, status: 'approved' | 'rejected') {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status } : x)));
    setInfo(null);
    if (supabase && !r.demo) {
      const { error } = await supabase.from('chauffeur_applications').update({ status }).eq('id', r.id);
      if (error) { setError(error.message); return; }
    }
    if (status === 'approved') {
      try {
        await createEntry({
          collection: 'driver',
          title: r.name,
          status: 'published',
          position: 0,
          data: {
            name: r.name, phone: r.phone ?? '', whatsapp: r.phone ?? '', email: r.email ?? '',
            state: r.city ?? '', country: 'France', title: 'Chauffeur VTC',
            notes: `<p>Créé depuis la candidature ${r.reference}${r.vtcCard ? ` — carte VTC ${r.vtcCard}` : ''}.</p>${r.message ? `<p>${r.message}</p>` : ''}`,
          },
        });
        setInfo(`Fiche chauffeur créée pour ${r.name} — complétez-la dans Chauffeurs (photo, carte VTC, permis).`);
      } catch (e) {
        setError(`Candidature approuvée mais création de la fiche impossible : ${(e as Error).message}`);
      }
    }
  }

  const pending = rows.filter((a) => a.status === 'new' || a.status === 'reviewing').length;

  const columns: Column<Row>[] = [
    { key: 'reference', header: 'Réf.', value: (a) => a.reference, render: (a) => <span className="fw-semibold">{a.reference}</span> },
    { key: 'name', header: 'Nom', value: (a) => a.name },
    { key: 'city', header: 'Ville', filterable: true, value: (a) => a.city ?? '—' },
    { key: 'vtcCard', header: 'Carte VTC', value: (a) => a.vtcCard ?? '—' },
    { key: 'contact', header: 'Contact', sortable: false, value: (a) => a.phone ?? a.email ?? '—' },
    { key: 'status', header: 'Statut', filterable: true, value: (a) => LABELS[a.status] ?? a.status,
      render: (a) => <span className={`badge ${badge(a.status)}`}>{LABELS[a.status] ?? a.status}</span> },
    { key: 'actions', header: 'Actions', sortable: false, className: 'text-end pe-3', value: () => '',
      render: (a) => (writable && (a.status === 'new' || a.status === 'reviewing')) ? (
        <span className="text-nowrap">
          <button className="btn btn-sm btn-success me-1" onClick={() => decide(a, 'approved')}><i className="bi bi-person-plus me-1" />Approuver</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => decide(a, 'rejected')}>Refuser</button>
        </span>
      ) : <span className="text-muted small">—</span> },
  ];

  return (
    <div className="card card-outline card-warning">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">Candidatures chauffeurs</h3>
        <span className="badge text-bg-warning">{pending} en attente</span>
      </div>
      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {info && <div className="alert alert-success m-3">{info} <a href="/admin/content/driver">Ouvrir les chauffeurs →</a></div>}
        {!loading && (
          <DataTable columns={columns} rows={rows} rowKey={(a) => a.id}
            searchPlaceholder="Rechercher réf., nom, ville…" empty="Aucune candidature." />
        )}
      </div>
    </div>
  );
}
