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

  if (!def) return <div className="adm-card">Contenu inconnu : {key}</div>;
  const setField = (name: string, value: unknown) => { setData((d) => ({ ...d, [name]: value })); setDone(false); };

  async function onSave() {
    setSaving(true); setError(null);
    try { await saveSingleton(def.key, data); setDone(true); }
    catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="adm-card">Chargement…</div>;

  return (
    <div className="adm-editor">
      <div className="adm-toolbar"><h2 className="adm-h2">{def.label}</h2></div>
      {!writable && <div className="adm-card adm-card--warn">Lecture seule.</div>}
      {error && <div className="adm-card adm-card--err">Erreur : {error}</div>}
      {done && <div className="adm-card adm-card--ok">Enregistré ✓</div>}
      <div className="adm-card">
        <div className="adm-form-grid">
          {def.fields.map((f) => (
            <div key={f.name} className={f.type === 'textarea' ? 'adm-col-2' : ''}>
              <FieldInput field={f} value={data[f.name]} onChange={setField} disabled={!writable} />
            </div>
          ))}
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
