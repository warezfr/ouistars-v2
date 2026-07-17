import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthContext';

export default function Login() {
  const { signIn, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setError(error);
  }

  return (
    <div className="login-page d-flex align-items-center justify-content-center min-vh-100 bg-body-tertiary">
      <div className="login-box">
        <div className="card card-outline card-warning shadow">
          <div className="card-header text-center">
            <span className="h4 fw-bold">OUI<span className="text-warning">STARS</span></span>
            <div className="text-muted small">Back-office</div>
          </div>
          <div className="card-body login-card-body">
            <p className="login-box-msg">Connectez-vous pour accéder au back-office</p>

            {!configured && (
              <div className="alert alert-warning small">
                Supabase n’est pas configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
              </div>
            )}

            <form onSubmit={onSubmit}>
              <div className="input-group mb-3">
                <input type="email" className="form-control" placeholder="E-mail" autoComplete="username"
                  required value={email} onChange={(e) => setEmail(e.target.value)} />
                <span className="input-group-text"><i className="bi bi-envelope" /></span>
              </div>
              <div className="input-group mb-3">
                <input type="password" className="form-control" placeholder="Mot de passe" autoComplete="current-password"
                  required value={password} onChange={(e) => setPassword(e.target.value)} />
                <span className="input-group-text"><i className="bi bi-lock" /></span>
              </div>

              {error && <div className="alert alert-danger small py-2">{error}</div>}

              <div className="row">
                <div className="col-12">
                  <button type="submit" className="btn btn-warning w-100" disabled={busy || !configured}>
                    {busy ? 'Connexion…' : 'Se connecter'}
                  </button>
                </div>
              </div>
            </form>

            <p className="mt-3 mb-0 text-center">
              <a href="/" className="text-muted small">← Retour au site</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
