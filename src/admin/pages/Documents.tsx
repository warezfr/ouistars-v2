import { useEffect, useState } from 'react';
import { listEntries } from '../cms/api';
import DataTable, { type Column } from '../ui/DataTable';

/**
 * Journal des documents émis — alimenté automatiquement à chaque action
 * (PDF, impression, e-mail, WhatsApp) depuis les popups de documents.
 */
interface LogRow {
  id: string;
  number: string; kind: string; reference: string; client: string;
  action: string; detail?: string; by: string; at: string;
}

const KINDS: Record<string, string> = {
  invoice: 'Facture', quote: 'Devis', order: 'Bon de commande', mission: 'Ordre de mission',
};

export default function Documents() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEntries('doc_log')
      .then((all) => setRows(all.map((e) => ({ id: e.id, ...(e.data as Omit<LogRow, 'id'>) }))
        .sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<LogRow>[] = [
    { key: 'at', header: 'Date', value: (r) => r.at ?? '', render: (r) => (r.at ?? '').replace('T', ' ').slice(0, 16) },
    { key: 'number', header: 'Document', value: (r) => r.number, render: (r) => <span className="fw-semibold">{r.number}</span> },
    { key: 'kind', header: 'Type', filterable: true, value: (r) => KINDS[r.kind] ?? r.kind },
    { key: 'reference', header: 'Réf. réservation', value: (r) => r.reference },
    { key: 'client', header: 'Client', value: (r) => r.client },
    { key: 'action', header: 'Action', filterable: true, value: (r) => r.action,
      render: (r) => <><span className="badge text-bg-light border">{r.action}</span>{r.detail && <span className="small text-muted ms-1">{r.detail}</span>}</> },
    { key: 'by', header: 'Par', filterable: true, value: (r) => r.by },
  ];

  return (
    <div className="card card-outline card-warning">
      <div className="card-header">
        <h3 className="card-title mb-0">Journal des documents
          <span className="badge text-bg-secondary ms-2">{rows.length}</span>
        </h3>
      </div>
      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">{error}</div>}
        {!loading && !error && (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
            searchPlaceholder="Rechercher n°, client, réf.…"
            empty="Aucun document émis pour l'instant — chaque PDF, impression ou envoi apparaîtra ici automatiquement." />
        )}
      </div>
    </div>
  );
}
