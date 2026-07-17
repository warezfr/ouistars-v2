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

  if (!def) return <div className="adm-card">Collection inconnue : {collection}</div>;

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
    <div>
      <div className="adm-toolbar">
        <div>
          <h2 className="adm-h2">{def.label}</h2>
          <p className="adm-muted">{rows.length} élément(s)</p>
        </div>
        {writable && <Link className="adm-btn adm-btn--gold" to={`/admin/content/${def.key}/new`}>+ {def.singular}</Link>}
      </div>

      {loading && <div className="adm-card">Chargement…</div>}
      {error && <div className="adm-card adm-card--err">Erreur : {error}</div>}

      {!loading && !error && (
        <div className="adm-card adm-card--pad0">
          <table className="adm-table">
            <thead><tr><th></th><th>Titre</th><th>Statut</th><th>Ordre</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="adm-empty">Aucun élément. {writable && 'Cliquez sur « + » pour en ajouter.'}</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="adm-td-thumb">{thumbOf(r) && <img src={thumbOf(r)!} alt="" loading="lazy" />}</td>
                  <td><Link className="adm-link" to={`/admin/content/${def.key}/${r.id}`}>{titleOf(r)}</Link></td>
                  <td>
                    <button className={`adm-pill ${r.status === 'published' ? 'is-on' : ''}`}
                      disabled={!writable} onClick={() => toggleStatus(r)}>
                      {r.status === 'published' ? 'Publié' : 'Brouillon'}
                    </button>
                  </td>
                  <td className="adm-muted">{r.position}</td>
                  <td className="adm-row-actions">
                    <Link className="adm-link" to={`/admin/content/${def.key}/${r.id}`}>Éditer</Link>
                    {writable && <button className="adm-linkbtn adm-danger" onClick={() => onDelete(r)}>Suppr.</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
