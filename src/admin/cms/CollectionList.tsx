import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCollection } from './collections';
import { listEntries, deleteEntry, updateEntry } from './api';
import type { CmsEntry } from './types';
import DataTable, { type Column } from '@/admin/ui/DataTable';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';

export default function CollectionList() {
  const { collection = '' } = useParams();
  const def = getCollection(collection);
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);

  const [rows, setRows] = useState<CmsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  async function load() {
    if (!def) return;
    setLoading(true); setError(null);
    try { setRows(await listEntries(def.key)); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [collection]);

  if (!def) return <div className="alert alert-warning">Collection inconnue : {collection}</div>;

  const titleOf = (r: CmsEntry) =>
    (def.titleField && (r.data[def.titleField] as string)) || r.title || r.slug || r.id.slice(0, 8);
  const thumbOf = (r: CmsEntry) => (def.thumbField ? (r.data[def.thumbField] as string) : null);

  /** Suppression douce : la fiche part à la corbeille (status archived). */
  async function onDelete(r: CmsEntry) {
    if (!confirm(`Mettre « ${titleOf(r)} » à la corbeille ?`)) return;
    await updateEntry(r.id, { status: 'archived' as never }); load();
  }
  async function onRestore(r: CmsEntry) {
    await updateEntry(r.id, { status: 'draft' }); load();
  }
  async function onHardDelete(r: CmsEntry) {
    if (!confirm(`Supprimer DÉFINITIVEMENT « ${titleOf(r)} » ? Cette action est irréversible.`)) return;
    await deleteEntry(r.id); load();
  }
  async function toggleStatus(r: CmsEntry) {
    await updateEntry(r.id, { status: r.status === 'published' ? 'draft' : 'published' });
    load();
  }

  const trashed = rows.filter((r) => (r.status as string) === 'archived');
  const active = rows.filter((r) => (r.status as string) !== 'archived');
  const shown = showTrash ? trashed : active;

  const columns: Column<CmsEntry>[] = [
    { key: 'thumb', header: '', sortable: false, width: 64,
      value: () => '', render: (r) => thumbOf(r)
        ? <img src={thumbOf(r)!} alt="" loading="lazy" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} />
        : <span className="text-muted"><i className="bi bi-file-earmark" /></span> },
    { key: 'title', header: 'Titre', value: (r) => titleOf(r),
      render: (r) => <Link to={`/admin/content/${def.key}/${r.id}`} className="fw-semibold text-decoration-none">{titleOf(r)}</Link> },
    { key: 'status', header: 'Statut', filterable: true, width: 130,
      value: (r) => r.status === 'published' ? 'Publié' : 'Brouillon',
      render: (r) => (
        <button className={`badge border-0 ${r.status === 'published' ? 'text-bg-success' : 'text-bg-secondary'}`}
          disabled={!writable} onClick={() => toggleStatus(r)}>
          {r.status === 'published' ? 'Publié' : 'Brouillon'}
        </button>
      ) },
    { key: 'position', header: 'Ordre', width: 80, value: (r) => r.position },
    { key: 'actions', header: 'Actions', sortable: false, width: 150, className: 'text-end pe-3',
      value: () => '', render: (r) => showTrash ? (
        <>
          {writable && <button className="btn btn-sm btn-outline-success me-1" title="Restaurer" onClick={() => onRestore(r)}><i className="bi bi-arrow-counterclockwise" /></button>}
          {writable && <button className="btn btn-sm btn-outline-danger" title="Supprimer définitivement" onClick={() => onHardDelete(r)}><i className="bi bi-x-octagon" /></button>}
        </>
      ) : (
        <>
          <Link className="btn btn-sm btn-outline-secondary me-1" to={`/admin/content/${def.key}/${r.id}`}><i className="bi bi-pencil" /></Link>
          {writable && <button className="btn btn-sm btn-outline-danger" title="Mettre à la corbeille" onClick={() => onDelete(r)}><i className="bi bi-trash" /></button>}
        </>
      ) },
  ];

  return (
    <div className="card card-outline card-warning">
      <div className="card-header d-flex align-items-center justify-content-between">
        <div>
          <h3 className="card-title mb-0">{def.label}</h3>
          <small className="text-muted">{active.length} élément(s){trashed.length > 0 && ` · corbeille : ${trashed.length}`}</small>
        </div>
        <div className="d-flex gap-2">
          {trashed.length > 0 && (
            <button className={`btn btn-sm ${showTrash ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setShowTrash((v) => !v)}>
              <i className="bi bi-trash me-1" />{showTrash ? 'Quitter la corbeille' : `Corbeille (${trashed.length})`}
            </button>
          )}
          {writable && !showTrash && (
            <Link className="btn btn-warning btn-sm" to={`/admin/content/${def.key}/new`}>
              <i className="bi bi-plus-lg me-1" />{def.singular}
            </Link>
          )}
        </div>
      </div>
      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">Erreur : {error}</div>}
        {!loading && !error && (
          <DataTable columns={columns} rows={shown} rowKey={(r) => r.id}
            searchPlaceholder={`Rechercher dans ${def.label.toLowerCase()}…`}
            empty={`Aucun élément.${writable ? ' Cliquez sur « + » pour en ajouter.' : ''}`} />
        )}
      </div>
    </div>
  );
}
