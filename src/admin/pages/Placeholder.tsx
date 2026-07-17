import { useLocation } from 'react-router-dom';

/** Écran générique pour les modules planifiés (non encore construits). */
export default function Placeholder({ title }: { title?: string }) {
  const loc = useLocation();
  const label = title ?? decodeURIComponent(loc.pathname.split('/').pop() ?? 'Module');
  return (
    <div className="adm-card adm-soon">
      <h2 className="adm-h2">{label}</h2>
      <p className="adm-muted">
        Ce module fait partie de l’architecture cible du back-office et sera construit
        lors d’une prochaine étape. La navigation et le socle (auth, rôles, CMS) sont déjà en place.
      </p>
      <span className="adm-soon__tag">Bientôt disponible</span>
    </div>
  );
}
