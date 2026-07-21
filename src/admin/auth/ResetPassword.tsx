import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

/**
 * Page atteinte via le lien reçu par e-mail (/admin/reset).
 * Supabase (detectSessionInUrl) transforme le jeton présent dans l'URL en une
 * session de récupération. On attend cet événement, puis on autorise la saisie
 * du nouveau mot de passe (updateUser). Route publique : ne passe pas par
 * ProtectedRoute pour que le lien fonctionne même déconnecté.
 */
export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const [ready, setReady] = useState(false);   // session de récupération détectée ?
  const [checking, setChecking] = useState(true);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    let cancelled = false;

    // Événement émis quand le lien de récupération est consommé.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || session) { setReady(true); setChecking(false); }
    });

    // Repli : si la session est déjà là au montage (jeton déjà consommé).
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) setReady(true);
      setChecking(false);
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (pw !== pw2) { setError('Les deux mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    const { error } = await updatePassword(pw);
    setBusy(false);
    if (error) { setError(error); return; }
    setDone(true);
    // Petite pause puis redirection vers le back-office (déjà authentifié).
    setTimeout(() => { window.location.assign('/admin'); }, 1600);
  }

  return (
    <div className="login-page d-flex align-items-center justify-content-center min-vh-100 bg-body-tertiary">
      <div className="login-box">
        <div className="card card-outline card-warning shadow">
          <div className="card-header text-center">
            <span className="h4 fw-bold">OUI<span className="text-warning">STARS</span></span>
            <div className="text-muted small">Nouveau mot de passe</div>
          </div>
          <div className="card-body login-card-body">
            {checking ? (
              <div className="text-center py-3">
                <div className="spinner-border text-warning" role="status" />
                <p className="text-muted small mt-2 mb-0">Vérification du lien…</p>
              </div>
            ) : done ? (
              <div className="alert alert-success small mb-0">
                <i className="bi bi-check-circle me-1" />
                Mot de passe mis à jour. Redirection vers le back-office…
              </div>
            ) : !ready ? (
              <>
                <div className="alert alert-danger small">
                  Ce lien de réinitialisation est invalide ou a expiré. Les liens ne sont
                  valables qu’une heure et une seule fois.
                </div>
                <a href="/admin" className="btn btn-warning w-100">Demander un nouveau lien</a>
              </>
            ) : (
              <form onSubmit={onSubmit}>
                <p className="login-box-msg">Choisissez un nouveau mot de passe.</p>
                <div className="input-group mb-3">
                  <input type="password" className="form-control" placeholder="Nouveau mot de passe"
                    autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
                  <span className="input-group-text"><i className="bi bi-lock" /></span>
                </div>
                <div className="input-group mb-3">
                  <input type="password" className="form-control" placeholder="Confirmer le mot de passe"
                    autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
                  <span className="input-group-text"><i className="bi bi-lock-fill" /></span>
                </div>

                {error && <div className="alert alert-danger small py-2">{error}</div>}

                <button type="submit" className="btn btn-warning w-100" disabled={busy}>
                  {busy ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
                </button>
              </form>
            )}

            <p className="mt-3 mb-0 text-center">
              <a href="/admin" className="text-muted small">← Connexion</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
