import type { Field } from './types';

/** Contenus « uniques » (une seule fiche) : About, CTA, Général, SEO. */
export interface SingletonDef {
  key: string;
  label: string;
  fields: Field[];
}

export const SINGLETONS: Record<string, SingletonDef> = {
  about: {
    key: 'about', label: 'À propos (La Maison)',
    fields: [
      { name: 'eyebrow', label: 'Sur-titre', type: 'text' },
      { name: 'name', label: 'Titre', type: 'text' },
      { name: 'body', label: 'Texte', type: 'textarea' },
      { name: 'stat1_value', label: 'Chiffre 1 — valeur', type: 'text' },
      { name: 'stat1_label', label: 'Chiffre 1 — libellé', type: 'text' },
      { name: 'stat2_value', label: 'Chiffre 2 — valeur', type: 'text' },
      { name: 'stat2_label', label: 'Chiffre 2 — libellé', type: 'text' },
      { name: 'stat3_value', label: 'Chiffre 3 — valeur', type: 'text' },
      { name: 'stat3_label', label: 'Chiffre 3 — libellé', type: 'text' },
      { name: 'image', label: 'Image', type: 'image' },
    ],
  },
  cta: {
    key: 'cta', label: 'Call to Action',
    fields: [
      { name: 'title', label: 'Titre', type: 'text' },
      { name: 'text', label: 'Texte', type: 'textarea' },
      { name: 'button', label: 'Bouton (libellé)', type: 'text' },
      { name: 'href', label: 'Bouton (lien)', type: 'text' },
    ],
  },
  general: {
    key: 'general', label: 'Réglages généraux',
    fields: [
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'email', label: 'E-mail', type: 'text' },
      { name: 'whatsapp', label: 'WhatsApp', type: 'text' },
      { name: 'address', label: 'Adresse', type: 'textarea' },
    ],
  },
  seo: {
    key: 'seo', label: 'SEO',
    fields: [
      { name: 'title', label: 'Titre (meta)', type: 'text' },
      { name: 'description', label: 'Description (meta)', type: 'textarea' },
      { name: 'ogImage', label: 'Image de partage (OG)', type: 'image' },
    ],
  },
};
