import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/admin/auth/AuthContext';
import DataTable, { type Column } from '../ui/DataTable';

/**
 * Clés API partenaires — authentification Bearer de l'API (/search /book /status /cancel).
 * Le token complet n'est affiché qu'UNE fois à la génération ; seul son hash
 * SHA-256 est stocké (token_hash) + un préfixe d'identification (token_prefix).
 */
interface KeyRow {
  id: string;
  partner_name: string;
  token_prefix?: string;
  active: boolean;
  last_used_at?: string;
  created_at: string;
}

const sha256Hex = async (text: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const randomToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return 'os_live_' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export default function ApiKeys() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [rows, setRows] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrated, setMigrated] = useState(true);
  const [name, setName] = useState('');
  const [freshToken, setFreshToken] = useState<{ name: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!supabase) { setError('Supabase non configuré.'); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error } = await supabase
      .from('etg_api_keys')
      .select('id, partner_name, token_prefix, active, last_used_at, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      // Table pas migrée / RLS pas posée
      setMigrated(false);
      setError(error.message.includes('permission') || error.message.includes('policy')
        ? 'Accès refusé — la migration « clés API » (RLS admin) n’est pas encore appliquée en base.'
        : error.message);
    } else {
      setMigrated(true);
      setRows((data ?? []) as KeyRow[]);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function generate() {
    if (!supabase || !name.trim()) return;
    setBusy(true); setError(null);
    try {
      const token = randomToken();
      const token_hash = await sha256Hex(token);
      const { error } = await supabase.from('etg_api_keys').insert({
        partner_name: name.trim(),
        token_hash,
        token_prefix: token.slice(0, 16),
        active: true,
      });
      if (error) throw error;
      setFreshToken({ name: name.trim(), token });
      setCopied(false);
      setName('');
      load();
    } catch (e) {
      setError(`Génération impossible : ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(k: KeyRow) {
    if (!supabase) return;
    const { error } = await supabase.from('etg_api_keys').update({ active: !k.active }).eq('id', k.id);
    if (error) setError(error.message); else load();
  }

  async function remove(k: KeyRow) {
    if (!supabase) return;
    if (!confirm(`Révoquer définitivement la clé « ${k.partner_name} » ? Les appels avec ce token échoueront immédiatement.`)) return;
    const { error } = await supabase.from('etg_api_keys').delete().eq('id', k.id);
    if (error) setError(error.message); else load();
  }

  const copy = async () => {
    if (!freshToken) return;
    try { await navigator.clipboard.writeText(freshToken.token); setCopied(true); } catch { /* sélection manuelle */ }
  };

  const columns: Column<KeyRow>[] = [
    { key: 'partner_name', header: 'Partenaire', value: (k) => k.partner_name,
      render: (k) => <span className="fw-semibold">{k.partner_name}</span> },
    { key: 'token_prefix', header: 'Token', sortable: false,
      value: (k) => k.token_prefix ?? '',
      render: (k) => <code>{k.token_prefix ?? 'os_live_'}…</code> },
    { key: 'active', header: 'Statut', filterable: true,
      value: (k) => (k.active ? 'Active' : 'Désactivée'),
      render: (k) => <span className={`badge ${k.active ? 'text-bg-success' : 'text-bg-secondary'}`}>{k.active ? 'Active' : 'Désactivée'}</span> },
    { key: 'last_used_at', header: 'Dernier appel', value: (k) => k.last_used_at ?? '',
      render: (k) => k.last_used_at ? (k.last_used_at).replace('T', ' ').slice(0, 16) : 'Jamais' },
    { key: 'created_at', header: 'Créée le', value: (k) => k.created_at,
      render: (k) => (k.created_at ?? '').slice(0, 10) },
    { key: 'actions', header: 'Actions', sortable: false, className: 'text-end pe-3', value: () => '',
      render: (k) => isAdmin ? (
        <span className="text-nowrap">
          <button className={`btn btn-sm me-1 ${k.active ? 'btn-outline-secondary' : 'btn-outline-success'}`}
            title={k.active ? 'Désactiver' : 'Réactiver'} onClick={() => toggle(k)}>
            <i className={`bi ${k.active ? 'bi-pause-circle' : 'bi-play-circle'}`} />
          </button>
          <button className="btn btn-sm btn-outline-danger" title="Révoquer (suppression)" onClick={() => remove(k)}>
            <i className="bi bi-trash" />
          </button>
        </span>
      ) : <span className="text-muted small">—</span> },
  ];

  return (
    <>
      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card card-outline card-warning">
            <div className="card-header">
              <h3 className="card-title mb-0">Clés API <span className="badge text-bg-secondary ms-1">{rows.length}</span></h3>
            </div>
            <div className="card-body p-0">
              {loading && <div className="p-3 text-muted">Chargement…</div>}
              {error && <div className="alert alert-danger m-3">{error}</div>}
              {!loading && migrated && (
                <DataTable columns={columns} rows={rows} rowKey={(k) => k.id}
                  searchPlaceholder="Rechercher un partenaire…"
                  empty="Aucune clé — générez la première ci-contre." />
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card card-outline card-secondary">
            <div className="card-header"><h3 className="card-title mb-0">Générer une clé</h3></div>
            <div className="card-body">
              <p className="text-muted small">
                Le token est affiché <strong>une seule fois</strong> : copiez-le et transmettez-le au partenaire.
                Seule son empreinte SHA-256 est conservée en base.
              </p>
              <label className="form-label">Nom du partenaire</label>
              <input className="form-control mb-3" placeholder="Ex. ETG / RateHawk"
                value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} />
              <button className="btn btn-warning w-100" onClick={generate} disabled={!isAdmin || busy || !name.trim() || !migrated}>
                <i className={`bi ${busy ? 'bi-hourglass-split' : 'bi-key'} me-1`} />
                {busy ? 'Génération…' : 'Générer le token'}
              </button>
              {!isAdmin && <small className="text-muted d-block mt-2">Seul un rôle « admin » peut gérer les clés.</small>}
              <hr />
              <p className="small text-muted mb-1"><strong>Utilisation (API) :</strong></p>
              <pre className="small bg-body-tertiary border rounded p-2 mb-0" style={{ whiteSpace: 'pre-wrap' }}>{`POST /search
Authorization: Bearer os_live_…`}</pre>
            </div>
          </div>
        </div>
      </div>

      {freshToken && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title"><i className="bi bi-key me-2 text-warning" />Token généré — {freshToken.name}</h5>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning small">
                    <i className="bi bi-exclamation-triangle me-1" />
                    Copiez ce token maintenant : il ne sera <strong>plus jamais affiché</strong>.
                  </div>
                  <div className="input-group">
                    <input className="form-control font-monospace" readOnly value={freshToken.token}
                      onFocus={(e) => e.target.select()} />
                    <button className={`btn ${copied ? 'btn-success' : 'btn-warning'}`} onClick={copy}>
                      <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-1`} />{copied ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setFreshToken(null)}>
                    J’ai copié le token — fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
