import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import Login from './Login';

/**
 * Garde d'accès au back-office.
 * - Chargement → écran d'attente.
 * - Non connecté → page de connexion.
 * - Connecté mais pas encore autorisé (absent de admin_profiles / inactif) → message.
 * - Autorisé → contenu.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return <div className="adm-gate">Chargement…</div>;
  }
  if (!session) {
    return <Login />;
  }
  if (!profile?.active) {
    return (
      <div className="adm-gate">
        <div className="adm-gate__box">
          <h2>Accès en attente</h2>
          <p>
            Votre compte est connecté mais n’est pas encore autorisé pour le back-office.
            Un administrateur doit vous ajouter à <code>admin_profiles</code>.
          </p>
          <LogoutLink />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function LogoutLink() {
  const { signOut, email } = useAuth();
  return (
    <p className="adm-gate__foot">
      Connecté en tant que {email} · <button className="adm-linkbtn" onClick={signOut}>Se déconnecter</button>
    </p>
  );
}
