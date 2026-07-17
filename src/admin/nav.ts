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
      { label: 'Agences', icon: 'bi-building', soon: true },
      { label: 'Entreprises', icon: 'bi-briefcase', soon: true },
      { label: 'Chauffeurs', icon: 'bi-person-badge', to: '/admin/drivers' },
      { label: 'Flotte', icon: 'bi-truck-front', to: '/admin/vehicles' },
      { label: 'Types de véhicule', icon: 'bi-diagram-3', soon: true },
      { label: 'Marques de véhicule', icon: 'bi-tags', soon: true },
      { label: 'Destinations', icon: 'bi-geo-alt', collection: 'destination' },
      { label: 'Trajets', icon: 'bi-signpost-split', collection: 'route' },
      { label: 'Tarifs de transfert', icon: 'bi-cash-coin', to: '/admin/pricing' },
      { label: 'Forfaits', icon: 'bi-box-seam', collection: 'package' },
    ],
  },
  {
    section: 'Utilisateurs',
    items: [{ label: 'Utilisateurs', icon: 'bi-people', soon: true }],
  },
  {
    section: 'Réservations',
    items: [
      { label: 'Réservations', icon: 'bi-calendar-check', to: '/admin/bookings' },
      { label: 'Réservations véhicules', icon: 'bi-car-front', soon: true },
      { label: 'Avis', icon: 'bi-star', soon: true },
      { label: 'Demandes de réservation', icon: 'bi-envelope-paper', to: '/admin/quotes' },
    ],
  },
  {
    section: 'Marketing',
    items: [{ label: 'Popups', icon: 'bi-megaphone', soon: true }],
  },
  {
    section: 'Espace client',
    items: [
      { label: 'Leads', icon: 'bi-funnel', soon: true },
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
      { label: 'Call to Action', icon: 'bi-megaphone-fill', to: '/admin/singleton/cta' },
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
      { label: 'Général', icon: 'bi-gear', to: '/admin/singleton/general' },
      { label: 'SEO', icon: 'bi-search', to: '/admin/singleton/seo' },
      { label: 'Staff & Rôles', icon: 'bi-person-gear', soon: true },
      { label: 'Langues', icon: 'bi-translate', soon: true },
      { label: 'Corbeille', icon: 'bi-trash', soon: true },
    ],
  },
];
