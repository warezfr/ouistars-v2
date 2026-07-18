/**
 * Arborescence complète du back-office (reproduit le cahier des charges).
 * - `collection` → module CMS générique (fonctionnel)   /admin/content/:collection
 * - `to`         → page dédiée existante                 /admin/...
 * - `soon`       → module planifié (placeholder)         écran « Bientôt disponible »
 * `icon` = classe Bootstrap Icons (AdminLTE).
 */
export interface NavEntry {
  label: string;
  icon: string;
  to?: string;
  collection?: string;
  soon?: boolean;
}
export interface NavGroup {
  section: string;
  items: NavEntry[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    section: 'Pilotage',
    items: [
      { label: 'Command Center', icon: 'bi-speedometer2', to: '/admin' },
    ],
  },
  {
    section: 'Opérations',
    items: [
      { label: 'Réservations', icon: 'bi-calendar-check', to: '/admin/bookings' },
      { label: 'Devis & événements', icon: 'bi-envelope-paper', to: '/admin/quotes' },
      { label: 'Factures', icon: 'bi-receipt', to: '/admin/invoices' },
      { label: 'Clients', icon: 'bi-person-lines-fill', to: '/admin/clients' },
      { label: 'Journal des documents', icon: 'bi-file-earmark-text', to: '/admin/documents' },
    ],
  },
  {
    section: 'Flotte & chauffeurs',
    items: [
      { label: 'Chauffeurs', icon: 'bi-person-badge', collection: 'driver' },
      { label: 'Candidatures', icon: 'bi-file-earmark-person', to: '/admin/applications' },
      { label: 'Flotte', icon: 'bi-truck-front', collection: 'vehicle' },
      { label: 'Types de véhicule', icon: 'bi-diagram-3', collection: 'vehicle_type' },
      { label: 'Marques de véhicule', icon: 'bi-tags', collection: 'vehicle_brand' },
    ],
  },
  {
    section: 'Offre & tarifs',
    items: [
      { label: 'Tarification globale', icon: 'bi-gem', to: '/admin/pricing' },
      { label: 'Trajets & prix (fiches)', icon: 'bi-signpost-split', collection: 'route' },
      /* Forfaits & Destinations retirés : le front s'appuie désormais sur la
         grille des trajets (Itinéraires signature) — plus d'utilité. */
    ],
  },
  {
    section: 'Site web',
    items: [
      { label: 'Paramètres du site', icon: 'bi-gear', to: '/admin/singleton/settings' },
      { label: 'Services', icon: 'bi-grid', collection: 'service' },
      { label: 'Partenaires', icon: 'bi-award', collection: 'partner' },
      { label: 'Adresses prestige', icon: 'bi-pin-map', collection: 'address' },
      { label: 'FAQ', icon: 'bi-question-circle', collection: 'faq' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { label: 'Utilisateurs & rôles', icon: 'bi-people', to: '/admin/users' },
      { label: 'Clés API', icon: 'bi-key', to: '/admin/api-keys' },
      { label: 'Pays (référentiel)', icon: 'bi-globe', collection: 'country' },
    ],
  },
];
