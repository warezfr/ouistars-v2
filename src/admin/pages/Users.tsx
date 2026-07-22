import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/admin/auth/AuthContext';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
}

const ROLES = [
  { value: 'admin', label: 'Admin — tout gérer (contenu, tarifs, utilisateurs)' },
  { value: 'ops', label: 'Ops — édition du contenu et des réservations' },
  { value: 'readonly', label: 'Lecture seule' },
];

export default function Users() {
  const { profile: me } = useAuth();
  const isAdmin = me?.role === 'admin';

  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('ops');
  const [adding, setAdding] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  async function load() {
    if (!supabase) { setError('Supabase non configuré.'); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error } = await supabase.from('admin_profiles').select('*').order('created_at');
    if (error) setError(error.message);
    else setRows((data ?? []) as Profile[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function patch(id: string, changes: Partial<Profile>) {
    if (!supabase) return;
    const { error } = await supabase.from('admin_profiles').update(changes).eq('id', id);
    if (error) setError(error.message); else load();
  }

  async function removeUser(r: Profile) {
    if (!supabase) return;
    if (!confirm(`Supprimer définitivement l’utilisateur « ${r.email} » ?\nSon compte et son accès au back-office seront révoqués immédiatement.`)) return;
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Session expirée, reconnectez-vous.');
      const resp = await fetch('/api/admin/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: r.id }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(body.error ?? `Erreur ${resp.status}`);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function addProfile(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setAdding(true); setError(null); setInviteMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Session expirée, reconnectez-vous.');
      const r = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail.trim(), role: newRole, displayName: newName.trim() || null }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error ?? `Erreur ${r.status}`);
      setInviteMsg(body.message ?? 'Invitation envoyée.');
      setNewEmail(''); setNewName('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="row g-3">
      <div className="col-lg-8">
        <div className="card card-outline card-warning">
          <div className="card-header"><h3 className="card-title mb-0">Utilisateurs du back-office</h3></div>
          <div className="card-body p-0">
            {loading && <div className="p-3 text-muted">Chargement…</div>}
            {error && <div className="alert alert-danger m-3">{error}</div>}
            {!loading && (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead><tr><th>E-mail</th><th>Nom</th><th style={{ width: 190 }}>Rôle</th><th style={{ width: 90 }}>Actif</th><th style={{ width: 60 }} /></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className={r.id === me?.id ? 'table-active' : undefined}>
                        <td className="fw-semibold">{r.email}
                          {r.email === me?.email && <span className="badge text-bg-secondary ms-2">vous</span>}
                        </td>
                        <td>
                          <input className="form-control form-control-sm" defaultValue={r.display_name ?? ''}
                            disabled={!isAdmin} placeholder="—"
                            onBlur={(e) => e.target.value !== (r.display_name ?? '') && patch(r.id, { display_name: e.target.value || null })} />
                        </td>
                        <td>
                          <select className="form-select form-select-sm" value={r.role} disabled={!isAdmin || r.email === me?.email}
                            onChange={(e) => patch(r.id, { role: e.target.value })}>
                            {ROLES.map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}
                          </select>
                        </td>
                        <td>
                          <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" checked={r.active}
                              disabled={!isAdmin || r.email === me?.email}
                              onChange={(e) => patch(r.id, { active: e.target.checked })} />
                          </div>
                        </td>
                        <td className="text-end pe-3">
                          {r.id !== me?.id && (
                            <button className="btn btn-sm btn-outline-danger border-0" title="Supprimer l’utilisateur"
                              disabled={!isAdmin} onClick={() => removeUser(r)}>
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
      </div>

      <div className="col-lg-4">
        <div className="card card-outline card-secondary">
          <div className="card-header"><h3 className="card-title mb-0">Inviter un utilisateur</h3></div>
          <div className="card-body">
            <p className="text-muted small">
              Saisissez l’e-mail et le rôle : la personne reçoit un e-mail avec un lien
              pour définir son mot de passe, puis accède directement au back-office.
            </p>
            <form onSubmit={addProfile}>
              <div className="mb-2">
                <label className="form-label">E-mail</label>
                <input className="form-control" type="email" required value={newEmail} disabled={!isAdmin}
                  placeholder="prenom@exemple.com" onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div className="mb-2">
                <label className="form-label">Nom (facultatif)</label>
                <input className="form-control" value={newName} disabled={!isAdmin}
                  placeholder="Prénom Nom" onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Rôle</label>
                <select className="form-select" value={newRole} disabled={!isAdmin}
                  onChange={(e) => setNewRole(e.target.value)}>
                  {ROLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {inviteMsg && <div className="alert alert-success small py-2">{inviteMsg}</div>}
              <button className="btn btn-warning w-100" disabled={!isAdmin || adding}>
                {adding ? 'Envoi…' : 'Envoyer l’invitation'}
              </button>
              {!isAdmin && <small className="text-muted d-block mt-2">Seul un rôle « admin » peut gérer les utilisateurs.</small>}
            </form>
          </div>
        </div>

        <MyPasswordCard />
      </div>
    </div>
  );
}

/** Changement de son propre mot de passe (tout utilisateur connecté). */
function MyPasswordCard() {
  const { updatePassword } = useAuth();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 8) { setMsg({ ok: false, text: 'Au moins 8 caractères.' }); return; }
    if (pw !== pw2) { setMsg({ ok: false, text: 'Les deux mots de passe ne correspondent pas.' }); return; }
    setBusy(true);
    const { error } = await updatePassword(pw);
    setBusy(false);
    if (error) setMsg({ ok: false, text: error });
    else { setMsg({ ok: true, text: 'Mot de passe mis à jour.' }); setPw(''); setPw2(''); }
  }

  return (
    <div className="card card-outline card-secondary mt-3">
      <div className="card-header"><h3 className="card-title mb-0">Mon mot de passe</h3></div>
      <div className="card-body">
        <form onSubmit={onSubmit}>
          <div className="mb-2">
            <label className="form-label">Nouveau mot de passe</label>
            <input className="form-control" type="password" autoComplete="new-password" required
              value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Confirmer</label>
            <input className="form-control" type="password" autoComplete="new-password" required
              value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          {msg && <div className={`alert small py-2 ${msg.ok ? 'alert-success' : 'alert-danger'}`}>{msg.text}</div>}
          <button className="btn btn-warning w-100" disabled={busy}>
            {busy ? 'Enregistrement…' : 'Changer mon mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
