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
    <div className="adm-login">
      <form className="adm-login__card" onSubmit={onSubmit}>
        <div className="adm-login__brand">OUI<span>STARS</span></div>
        <p className="adm-login__sub">Back-office — connexion</p>

        {!configured && (
          <p className="adm-login__warn">
            Supabase n’est pas configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
            La connexion est indisponible tant que ces variables ne sont pas définies.
          </p>
        )}

        <label className="adm-field">
          <span>E-mail</span>
          <input type="email" autoComplete="username" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="admin@ouistars.com" />
        </label>
        <label className="adm-field">
          <span>Mot de passe</span>
          <input type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </label>

        {error && <p className="adm-login__err">{error}</p>}

        <button className="adm-btn adm-btn--gold" type="submit" disabled={busy || !configured}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
        <a className="adm-login__back" href="/">← Retour au site</a>
      </form>
    </div>
  );
}
