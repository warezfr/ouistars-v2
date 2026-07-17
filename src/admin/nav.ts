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
    section: 'Principal',
    items: [
      { label: 'Tableau de bord', icon: 'bi-speedometer2', to: '/admin' },
      { label: 'Chauffeurs', icon: 'bi-person-badge', collection: 'driver' },
      { label: 'Flotte', icon: 'bi-truck-front', collection: 'vehicle' },
      { label: 'Types de véhicule', icon: 'bi-diagram-3', collection: 'vehicle_type' },
      { label: 'Marques de véhicule', icon: 'bi-tags', collection: 'vehicle_brand' },
      { label: 'Destinations', icon: 'bi-geo-alt', collection: 'destination' },
      { label: 'Catég. destinations', icon: 'bi-bookmarks', collection: 'destination_category' },
      { label: 'Trajets', icon: 'bi-signpost-split', collection: 'route' },
      { label: 'Tarifs de transfert', icon: 'bi-cash-coin', to: '/admin/pricing' },
      { label: 'Forfaits', icon: 'bi-box-seam', collection: 'package' },
      { label: 'Catég. forfaits', icon: 'bi-boxes', collection: 'package_category' },
    ],
  },
  {
    section: 'Utilisateurs',
    items: [{ label: 'Utilisateurs & rôles', icon: 'bi-people', to: '/admin/users' }],
  },
  {
    section: 'Réservations',
    items: [
      { label: 'Réservations', icon: 'bi-calendar-check', to: '/admin/bookings' },
      { label: 'Demandes de réservation', icon: 'bi-envelope-paper', to: '/admin/quotes' },
    ],
  },
  {
    section: 'Espace client',
    items: [
      { label: 'Clients', icon: 'bi-person-lines-fill', soon: true },
      { label: 'Factures', icon: 'bi-receipt', soon: true },
      { label: 'Candidatures', icon: 'bi-file-earmark-person', to: '/admin/applications' },
    ],
  },
  {
    section: 'Contenu du site',
    items: [
      { label: 'Services', icon: 'bi-grid', collection: 'service' },
      { label: 'Catég. services', icon: 'bi-diagram-2', collection: 'service_category' },
      { label: 'Slides (Hero)', icon: 'bi-images', collection: 'slider' },
      { label: 'Chiffres clés', icon: 'bi-123', collection: 'counter' },
      { label: 'Atouts (Why Us)', icon: 'bi-patch-check', collection: 'feature' },
      { label: 'Étapes', icon: 'bi-list-ol', collection: 'step' },
      { label: 'Histoires', icon: 'bi-journal-text', collection: 'story' },
      { label: 'Témoignages', icon: 'bi-chat-quote', collection: 'testimonial' },
      { label: 'Équipe', icon: 'bi-people-fill', collection: 'team' },
      { label: 'Partenaires', icon: 'bi-award', collection: 'partner' },
      { label: 'Adresses prestige', icon: 'bi-pin-map', collection: 'address' },
      { label: 'FAQ', icon: 'bi-question-circle', collection: 'faq' },
      { label: 'Blog', icon: 'bi-file-post', collection: 'blog_post' },
      { label: 'Actualités', icon: 'bi-newspaper', collection: 'news' },
      { label: 'Photos', icon: 'bi-image', collection: 'photo' },
      { label: 'Vidéos', icon: 'bi-camera-video', collection: 'video' },
      { label: 'Pays', icon: 'bi-globe', collection: 'country' },
      { label: 'Pages statiques', icon: 'bi-file-earmark', collection: 'static_page' },
      { label: 'Politiques', icon: 'bi-shield-check', collection: 'policy' },
      { label: 'À propos', icon: 'bi-info-circle', to: '/admin/singleton/about' },
    ],
  },
  {
    section: 'Documents',
    items: [{ label: 'Documents chauffeurs', icon: 'bi-file-earmark-text', to: '/admin/documents' }],
  },
  {
    section: 'Outils',
    items: [
      { label: 'Messagerie', icon: 'bi-envelope', soon: true },
      { label: 'Tâches', icon: 'bi-kanban', soon: true },
      { label: 'Calendrier', icon: 'bi-calendar3', soon: true },
      { label: 'Gestionnaire de fichiers', icon: 'bi-folder2-open', soon: true },
      { label: 'Contacts', icon: 'bi-person-rolodex', soon: true },
    ],
  },
  {
    section: 'Réglages',
    items: [
      { label: 'Paramètres du site', icon: 'bi-gear', to: '/admin/singleton/settings' },
      { label: 'Tarifs horaires / km', icon: 'bi-clock-history', to: '/admin/singleton/rates' },
    ],
  },
];
