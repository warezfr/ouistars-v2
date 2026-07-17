import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import Login from './Login';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body-tertiary">
        <div className="spinner-border text-warning" role="status"><span className="visually-hidden">Chargement…</span></div>
      </div>
    );
  }
  if (!session) return <Login />;

  if (!profile?.active) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body-tertiary p-4">
        <div className="card shadow-sm" style={{ maxWidth: 460 }}>
          <div className="card-body text-center">
            <i className="bi bi-shield-lock display-5 text-warning" />
            <h5 className="mt-2">Accès en attente</h5>
            <p className="text-muted">
              Votre compte est connecté mais n’est pas encore autorisé pour le back-office.
              Un administrateur doit vous ajouter à <code>admin_profiles</code>.
            </p>
            <LogoutLink />
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function LogoutLink() {
  const { signOut, email } = useAuth();
  return (
    <p className="small text-muted mb-0">
      Connecté : {email} · <button className="btn btn-link btn-sm p-0 align-baseline" onClick={signOut}>Se déconnecter</button>
    </p>
  );
}
