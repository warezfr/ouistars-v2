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

  if (!def) return <div className="adm-card">Collection inconnue : {collection}</div>;

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

  if (loading) return <div className="adm-card">Chargement…</div>;

  return (
    <div className="adm-editor">
      <div className="adm-toolbar">
        <h2 className="adm-h2">{isNew ? `Nouveau — ${def.singular}` : `Éditer — ${def.singular}`}</h2>
        <button className="adm-linkbtn" onClick={() => nav(`/admin/content/${def.key}`)}>← Retour</button>
      </div>

      {!writable && <div className="adm-card adm-card--warn">Lecture seule — votre rôle ne permet pas la modification.</div>}
      {error && <div className="adm-card adm-card--err">Erreur : {error}</div>}

      <div className="adm-card">
        <div className="adm-form-grid">
          {def.fields.map((f) => (
            <div key={f.name} className={f.type === 'textarea' ? 'adm-col-2' : ''}>
              <FieldInput field={f} value={data[f.name]} onChange={setField} disabled={!writable} />
            </div>
          ))}
        </div>

        <div className="adm-form-meta">
          <label className="adm-field">
            <span>Statut</span>
            <select value={status} disabled={!writable} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
            </select>
          </label>
          <label className="adm-field">
            <span>Ordre</span>
            <input type="number" value={position} disabled={!writable}
              onChange={(e) => setPosition(Number(e.target.value))} />
          </label>
        </div>

        {writable && (
          <div className="adm-actions">
            <button className="adm-btn adm-btn--gold" onClick={onSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
