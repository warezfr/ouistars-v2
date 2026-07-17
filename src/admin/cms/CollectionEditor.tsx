import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCollection } from './collections';
import { createEntry, getEntry, updateEntry } from './api';
import FieldInput from './FieldInput';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';

export default function CollectionEditor() {
  const { collection = '', id } = useParams();
  const def = getCollection(collection);
  const isNew = !id || id === 'new';
  const nav = useNavigate();
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);

  const [data, setData] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [position, setPosition] = useState<number>(0);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !def) return;
    (async () => {
      try {
        const e = await getEntry(id!);
        if (e) { setData(e.data ?? {}); setStatus(e.status); setPosition(e.position); }
      } catch (e) { setError((e as Error).message); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, [id]);

  if (!def) return <div className="alert alert-warning">Collection inconnue : {collection}</div>;

  const setField = (name: string, value: unknown) => setData((d) => ({ ...d, [name]: value }));
  const title = def.titleField ? (data[def.titleField] as string) : undefined;

  async function onSave() {
    if (!def) return;
    setSaving(true); setError(null);
    try {
      const payload = { collection: def.key, data, status, position, title: title ?? null };
      if (isNew) await createEntry(payload);
      else await updateEntry(id!, payload);
      nav(`/admin/content/${def.key}`);
    } catch (e) { setError((e as Error).message); setSaving(false); }
  }

  if (loading) return <div className="card"><div className="card-body text-muted">Chargement…</div></div>;

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">{isNew ? `Nouveau — ${def.singular}` : `Éditer — ${def.singular}`}</h5>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => nav(`/admin/content/${def.key}`)}>
          <i className="bi bi-arrow-left me-1" />Retour
        </button>
      </div>

      {!writable && <div className="alert alert-warning">Lecture seule — votre rôle ne permet pas la modification.</div>}
      {error && <div className="alert alert-danger">Erreur : {error}</div>}

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card card-outline card-warning">
            <div className="card-body">
              <div className="row g-3">
                {def.fields.map((f) => (
                  <div key={f.name}
                    className={['textarea', 'richtext', 'repeater', 'image'].includes(f.type) ? 'col-12' : 'col-md-6'}>
                    <FieldInput field={f} value={data[f.name]} onChange={setField} disabled={!writable} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card card-outline card-secondary">
            <div className="card-header"><h3 className="card-title mb-0">Publication</h3></div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Statut</label>
                <select className="form-select" value={status} disabled={!writable}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Ordre d’affichage</label>
                <input type="number" className="form-control" value={position} disabled={!writable}
                  onChange={(e) => setPosition(Number(e.target.value))} />
              </div>
              {writable && (
                <button className="btn btn-warning w-100" onClick={onSave} disabled={saving}>
                  <i className="bi bi-check-lg me-1" />{saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
