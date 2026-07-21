import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthContext';

export default function Login() {
  const { signIn, sendReset, configured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null); setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setError(error);
  }

  async function onForgot(e: FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null); setBusy(true);
    const { error } = await sendReset(email);
    setBusy(false);
    if (error) setError(error);
    else setNotice(
      `Si un compte existe pour ${email.trim()}, un e-mail contenant un lien de ` +
      `réinitialisation vient d’être envoyé. Pensez à vérifier les indésirables.`,
    );
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
            <p className="login-box-msg">
              {mode === 'signin'
                ? 'Connectez-vous pour accéder au back-office'
                : 'Réinitialisation du mot de passe'}
            </p>

            {!configured && (
              <div className="alert alert-warning small">
                Supabase n’est pas configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
              </div>
            )}

            {mode === 'signin' ? (
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
                {notice && <div className="alert alert-success small py-2">{notice}</div>}

                <div className="row">
                  <div className="col-12">
                    <button type="submit" className="btn btn-warning w-100" disabled={busy || !configured}>
                      {busy ? 'Connexion…' : 'Se connecter'}
                    </button>
                  </div>
                </div>

                <p className="mt-3 mb-0 text-center">
                  <button type="button" className="btn btn-link btn-sm text-muted p-0"
                    onClick={() => { setMode('forgot'); setError(null); setNotice(null); }}>
                    Mot de passe oublié ?
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={onForgot}>
                <p className="text-muted small">
                  Saisissez l’e-mail de votre compte : nous vous enverrons un lien pour
                  définir un nouveau mot de passe.
                </p>
                <div className="input-group mb-3">
                  <input type="email" className="form-control" placeholder="E-mail" autoComplete="username"
                    required value={email} onChange={(e) => setEmail(e.target.value)} />
                  <span className="input-group-text"><i className="bi bi-envelope" /></span>
                </div>

                {error && <div className="alert alert-danger small py-2">{error}</div>}
                {notice && <div className="alert alert-success small py-2">{notice}</div>}

                <div className="row">
                  <div className="col-12">
                    <button type="submit" className="btn btn-warning w-100" disabled={busy || !configured}>
                      {busy ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
                    </button>
                  </div>
                </div>

                <p className="mt-3 mb-0 text-center">
                  <button type="button" className="btn btn-link btn-sm text-muted p-0"
                    onClick={() => { setMode('signin'); setError(null); setNotice(null); }}>
                    ← Retour à la connexion
                  </button>
                </p>
              </form>
            )}

            <p className="mt-3 mb-0 text-center">
              <a href="/" className="text-muted small">← Retour au site</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
