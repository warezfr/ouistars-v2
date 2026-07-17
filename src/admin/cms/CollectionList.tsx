import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCollection } from './collections';
import { listEntries, deleteEntry, updateEntry } from './api';
import type { CmsEntry } from './types';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';

export default function CollectionList() {
  const { collection = '' } = useParams();
  const def = getCollection(collection);
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);

  const [rows, setRows] = useState<CmsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  async function onDelete(r: CmsEntry) {
    if (!confirm(`Supprimer « ${titleOf(r)} » ?`)) return;
    await deleteEntry(r.id); load();
  }
  async function toggleStatus(r: CmsEntry) {
    await updateEntry(r.id, { status: r.status === 'published' ? 'draft' : 'published' });
    load();
  }

  return (
    <div className="card card-outline card-warning">
      <div className="card-header d-flex align-items-center justify-content-between">
        <div>
          <h3 className="card-title mb-0">{def.label}</h3>
          <small className="text-muted">{rows.length} élément(s)</small>
        </div>
        {writable && (
          <Link className="btn btn-warning btn-sm" to={`/admin/content/${def.key}/new`}>
            <i className="bi bi-plus-lg me-1" />{def.singular}
          </Link>
        )}
      </div>

      <div className="card-body p-0">
        {loading && <div className="p-3 text-muted">Chargement…</div>}
        {error && <div className="alert alert-danger m-3">Erreur : {error}</div>}
        {!loading && !error && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 64 }} />
                  <th>Titre</th>
                  <th style={{ width: 130 }}>Statut</th>
                  <th style={{ width: 80 }}>Ordre</th>
                  <th style={{ width: 140 }} className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted py-4">
                    Aucun élément.{writable && ' Cliquez sur « + » pour en ajouter.'}
                  </td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {thumbOf(r)
                        ? <img src={thumbOf(r)!} alt="" loading="lazy"
                            style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                        : <span className="text-muted"><i className="bi bi-file-earmark" /></span>}
                    </td>
                    <td><Link to={`/admin/content/${def.key}/${r.id}`} className="fw-semibold text-decoration-none">{titleOf(r)}</Link></td>
                    <td>
                      <button className={`badge border-0 ${r.status === 'published' ? 'text-bg-success' : 'text-bg-secondary'}`}
                        disabled={!writable} onClick={() => toggleStatus(r)}>
                        {r.status === 'published' ? 'Publié' : 'Brouillon'}
                      </button>
                    </td>
                    <td className="text-muted">{r.position}</td>
                    <td className="text-end pe-3">
                      <Link className="btn btn-sm btn-outline-secondary me-1" to={`/admin/content/${def.key}/${r.id}`}>
                        <i className="bi bi-pencil" />
                      </Link>
                      {writable && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(r)}>
                          <i className="bi bi-trash" />
                        </button>
                      )}
                    </td>
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
