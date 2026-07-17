import type { Collection } from './types';

/**
 * Registre des collections de contenu du site.
 * Une seule interface générique (liste + éditeur) couvre toutes ces entités,
 * pilotée par la configuration de champs ci-dessous.
 */
const ICON_OPTIONS = [
  'fleet', 'globe', 'plane', 'jet', 'star', 'sparkle', 'briefcase',
  'building', 'shield', 'map', 'bell', 'car', 'crown', 'diamond',
].map((v) => ({ value: v, label: v }));

export const COLLECTIONS: Record<string, Collection> = {
  service: {
    key: 'service', label: 'Services', singular: 'Service', titleField: 'fr', thumbField: 'image',
    fields: [
      { name: 'fr', label: 'Nom (FR)', type: 'text', required: true },
      { name: 'en', label: 'Nom (EN)', type: 'text' },
      { name: 'descFr', label: 'Description (FR)', type: 'textarea' },
      { name: 'descEn', label: 'Description (EN)', type: 'textarea' },
      { name: 'icon', label: 'Icône', type: 'select', options: ICON_OPTIONS },
      { name: 'image', label: 'Image de fond', type: 'image' },
    ],
  },
  service_category: {
    key: 'service_category', label: 'Catégories de services', singular: 'Catégorie', titleField: 'name',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text' },
    ],
  },
  partner: {
    key: 'partner', label: 'Partenaires', singular: 'Partenaire', titleField: 'name', thumbField: 'src',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'src', label: 'Logo', type: 'image', required: true },
    ],
  },
  address: {
    key: 'address', label: 'Adresses prestigieuses', singular: 'Adresse', titleField: 'label',
    fields: [{ name: 'label', label: 'Libellé', type: 'text', required: true }],
  },
  faq: {
    key: 'faq', label: 'FAQ', singular: 'Question', titleField: 'q',
    fields: [
      { name: 'q', label: 'Question', type: 'text', required: true },
      { name: 'a', label: 'Réponse', type: 'textarea', required: true },
    ],
  },
  faq_category: {
    key: 'faq_category', label: 'Catégories FAQ', singular: 'Catégorie', titleField: 'name',
    fields: [{ name: 'name', label: 'Nom', type: 'text', required: true }],
  },
  testimonial: {
    key: 'testimonial', label: 'Témoignages', singular: 'Témoignage', titleField: 'author', thumbField: 'avatar',
    fields: [
      { name: 'author', label: 'Auteur', type: 'text', required: true },
      { name: 'role', label: 'Fonction / société', type: 'text' },
      { name: 'quote', label: 'Citation', type: 'textarea', required: true },
      { name: 'avatar', label: 'Photo', type: 'image' },
    ],
  },
  team: {
    key: 'team', label: 'Équipe', singular: 'Membre', titleField: 'name', thumbField: 'photo',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'role', label: 'Rôle', type: 'text' },
      { name: 'photo', label: 'Photo', type: 'image' },
      { name: 'bio', label: 'Bio', type: 'textarea' },
    ],
  },
  feature: {
    key: 'feature', label: 'Atouts (Why Us)', singular: 'Atout', titleField: 'title',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'text', label: 'Texte', type: 'textarea' },
      { name: 'icon', label: 'Icône', type: 'select', options: ICON_OPTIONS },
    ],
  },
  step: {
    key: 'step', label: 'Étapes', singular: 'Étape', titleField: 'title',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'text', label: 'Texte', type: 'textarea' },
    ],
  },
  counter: {
    key: 'counter', label: 'Chiffres clés', singular: 'Chiffre', titleField: 'label',
    fields: [
      { name: 'value', label: 'Valeur', type: 'text', required: true },
      { name: 'label', label: 'Libellé', type: 'text', required: true },
    ],
  },
  slider: {
    key: 'slider', label: 'Slides (Hero)', singular: 'Slide', titleField: 'title', thumbField: 'image',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'subtitle', label: 'Sous-titre', type: 'textarea' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'cta', label: 'Bouton (libellé)', type: 'text' },
      { name: 'ctaHref', label: 'Bouton (lien)', type: 'text' },
    ],
  },
  story: {
    key: 'story', label: 'Histoires', singular: 'Histoire', titleField: 'title', thumbField: 'image',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'text', label: 'Texte', type: 'textarea' },
      { name: 'image', label: 'Image', type: 'image' },
    ],
  },
  blog_post: {
    key: 'blog_post', label: 'Articles (Blog)', singular: 'Article', titleField: 'title', thumbField: 'cover',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'excerpt', label: 'Extrait', type: 'textarea' },
      { name: 'body', label: 'Contenu', type: 'textarea' },
      { name: 'cover', label: 'Image', type: 'image' },
      { name: 'category', label: 'Catégorie', type: 'text' },
    ],
  },
  blog_category: {
    key: 'blog_category', label: 'Catégories Blog', singular: 'Catégorie', titleField: 'name',
    fields: [{ name: 'name', label: 'Nom', type: 'text', required: true }],
  },
  news: {
    key: 'news', label: 'Actualités', singular: 'Actualité', titleField: 'title', thumbField: 'cover',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'excerpt', label: 'Extrait', type: 'textarea' },
      { name: 'body', label: 'Contenu', type: 'textarea' },
      { name: 'cover', label: 'Image', type: 'image' },
    ],
  },
  static_page: {
    key: 'static_page', label: 'Pages statiques', singular: 'Page', titleField: 'title',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'body', label: 'Contenu', type: 'textarea' },
    ],
  },
  policy: {
    key: 'policy', label: 'Politiques', singular: 'Politique', titleField: 'title',
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'body', label: 'Contenu', type: 'textarea' },
    ],
  },
  country: {
    key: 'country', label: 'Pays', singular: 'Pays', titleField: 'name',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'code', label: 'Code ISO', type: 'text' },
    ],
  },
  photo: {
    key: 'photo', label: 'Photos', singular: 'Photo', titleField: 'title', thumbField: 'image',
    fields: [
      { name: 'title', label: 'Titre', type: 'text' },
      { name: 'image', label: 'Image', type: 'image', required: true },
      { name: 'category', label: 'Catégorie', type: 'text' },
    ],
  },
  video: {
    key: 'video', label: 'Vidéos', singular: 'Vidéo', titleField: 'title', thumbField: 'thumb',
    fields: [
      { name: 'title', label: 'Titre', type: 'text' },
      { name: 'url', label: 'URL', type: 'text', required: true },
      { name: 'thumb', label: 'Vignette', type: 'image' },
    ],
  },
  package: {
    key: 'package', label: 'Forfaits', singular: 'Forfait', titleField: 'name', thumbField: 'image',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'desc', label: 'Description', type: 'textarea' },
      { name: 'price', label: 'Prix (€)', type: 'number' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'category', label: 'Catégorie', type: 'text' },
    ],
  },
  destination: {
    key: 'destination', label: 'Destinations', singular: 'Destination', titleField: 'name', thumbField: 'image',
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'region', label: 'Région', type: 'text' },
      { name: 'image', label: 'Image', type: 'image' },
    ],
  },
  route: {
    key: 'route', label: 'Trajets', singular: 'Trajet', titleField: 'label',
    fields: [
      { name: 'label', label: 'Libellé', type: 'text', required: true },
      { name: 'from', label: 'Départ', type: 'text' },
      { name: 'to', label: 'Arrivée', type: 'text' },
      { name: 'priceE', label: 'Prix Business (E)', type: 'number' },
      { name: 'priceV', label: 'Prix Van (V)', type: 'number' },
      { name: 'priceS', label: 'Prix First (S)', type: 'number' },
    ],
  },
};

export function getCollection(key: string): Collection | undefined {
  return COLLECTIONS[key];
}
