import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SINGLETONS } from './singletons';
import { getSingleton, saveSingleton } from './api';
import FieldInput from './FieldInput';
import { useAuth, canWrite } from '@/admin/auth/AuthContext';

export default function SingletonEditor() {
  const { key = '' } = useParams();
  const def = SINGLETONS[key];
  const { profile } = useAuth();
  const writable = canWrite(profile?.role);

  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!def) return;
    (async () => {
      try { setData(await getSingleton(def.key)); }
      catch (e) { setError((e as Error).message); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, [key]);

  if (!def) return <div className="alert alert-warning">Contenu inconnu : {key}</div>;
  const setField = (name: string, value: unknown) => { setData((d) => ({ ...d, [name]: value })); setDone(false); };

  async function onSave() {
    setSaving(true); setError(null);
    try { await saveSingleton(def.key, data); setDone(true); }
    catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="card"><div className="card-body text-muted">Chargement…</div></div>;

  return (
    <div className="card card-outline card-warning">
      <div className="card-header"><h3 className="card-title mb-0">{def.label}</h3></div>
      <div className="card-body">
        {!writable && <div className="alert alert-warning">Lecture seule.</div>}
        {error && <div className="alert alert-danger">Erreur : {error}</div>}
        {done && <div className="alert alert-success py-2">Enregistré ✓</div>}
        <div className="row g-3">
          {def.fields.map((f) => (
            <div key={f.name} className={['textarea', 'richtext', 'repeater', 'image'].includes(f.type) ? 'col-12' : 'col-md-6'}>
              <FieldInput field={f} value={data[f.name]} onChange={setField} disabled={!writable} />
            </div>
          ))}
        </div>
        {writable && (
          <button className="btn btn-warning mt-3" onClick={onSave} disabled={saving}>
            <i className="bi bi-check-lg me-1" />{saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        )}
      </div>
    </div>
  );
}
