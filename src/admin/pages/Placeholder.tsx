import { useLocation } from 'react-router-dom';

/** Écran générique pour les modules planifiés (non encore construits). */
export default function Placeholder({ title }: { title?: string }) {
  const loc = useLocation();
  const label = title ?? decodeURIComponent(loc.pathname.split('/').pop() ?? 'Module');
  return (
    <div className="card card-outline card-secondary">
      <div className="card-body text-center py-5">
        <i className="bi bi-cone-striped display-4 text-warning" />
        <h4 className="mt-3">{label}</h4>
        <p className="text-muted mb-3">
          Ce module fait partie de l’architecture cible du back-office et sera construit lors d’une prochaine étape.
          La navigation et le socle (auth, rôles, CMS, thème AdminLTE) sont déjà en place.
        </p>
        <span className="badge text-bg-warning">Bientôt disponible</span>
      </div>
    </div>
  );
}
