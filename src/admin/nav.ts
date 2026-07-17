/**
 * Arborescence complète du back-office (reproduit le cahier des charges).
 * - `collection` → module CMS générique (fonctionnel)   /admin/content/:collection
 * - `to`         → page dédiée existante                 /admin/...
 * - `soon`       → module planifié (placeholder)         écran « Bientôt disponible »
 */
export interface NavEntry {
  label: string;
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
      { label: 'Tableau de bord', to: '/admin' },
      { label: 'Agences', soon: true },
      { label: 'Entreprises', soon: true },
      { label: 'Chauffeurs', to: '/admin/drivers' },
      { label: 'Flotte', to: '/admin/vehicles' },
      { label: 'Types de véhicule', soon: true },
      { label: 'Marques de véhicule', soon: true },
      { label: 'Destinations', collection: 'destination' },
      { label: 'Trajets', collection: 'route' },
      { label: 'Tarifs de transfert', to: '/admin/pricing' },
      { label: 'Forfaits', collection: 'package' },
    ],
  },
  {
    section: 'Utilisateurs',
    items: [{ label: 'Utilisateurs', soon: true }],
  },
  {
    section: 'Réservations',
    items: [
      { label: 'Réservations', to: '/admin/bookings' },
      { label: 'Réservations véhicules', soon: true },
      { label: 'Avis', soon: true },
      { label: 'Demandes de réservation', to: '/admin/quotes' },
    ],
  },
  {
    section: 'Marketing',
    items: [{ label: 'Popups', soon: true }],
  },
  {
    section: 'Espace client',
    items: [
      { label: 'Leads', soon: true },
      { label: 'Clients', soon: true },
      { label: 'Factures', soon: true },
      { label: 'Candidatures', to: '/admin/applications' },
    ],
  },
  {
    section: 'Contenu du site',
    items: [
      { label: 'Services', collection: 'service' },
      { label: 'Catég. services', collection: 'service_category' },
      { label: 'Slides (Hero)', collection: 'slider' },
      { label: 'Chiffres clés', collection: 'counter' },
      { label: 'Atouts (Why Us)', collection: 'feature' },
      { label: 'Étapes', collection: 'step' },
      { label: 'Histoires', collection: 'story' },
      { label: 'Témoignages', collection: 'testimonial' },
      { label: 'Équipe', collection: 'team' },
      { label: 'Partenaires', collection: 'partner' },
      { label: 'Adresses prestige', collection: 'address' },
      { label: 'FAQ', collection: 'faq' },
      { label: 'Blog', collection: 'blog_post' },
      { label: 'Actualités', collection: 'news' },
      { label: 'Photos', collection: 'photo' },
      { label: 'Vidéos', collection: 'video' },
      { label: 'Pays', collection: 'country' },
      { label: 'Pages statiques', collection: 'static_page' },
      { label: 'Politiques', collection: 'policy' },
      { label: 'À propos', to: '/admin/singleton/about' },
      { label: 'Call to Action', to: '/admin/singleton/cta' },
    ],
  },
  {
    section: 'Documents',
    items: [{ label: 'Documents chauffeurs', to: '/admin/documents' }],
  },
  {
    section: 'Outils',
    items: [
      { label: 'Messagerie', soon: true },
      { label: 'Tâches', soon: true },
      { label: 'Calendrier', soon: true },
      { label: 'Gestionnaire de fichiers', soon: true },
      { label: 'Contacts', soon: true },
    ],
  },
  {
    section: 'Réglages',
    items: [
      { label: 'Général', to: '/admin/singleton/general' },
      { label: 'SEO', to: '/admin/singleton/seo' },
      { label: 'Staff & Rôles', soon: true },
      { label: 'Langues', soon: true },
      { label: 'Corbeille', soon: true },
    ],
  },
];
