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
  settings: {
    key: 'settings', label: 'Paramètres du site',
    fields: [
      { name: 'logo', label: 'Logo (nav)', type: 'image' },
      { name: 'brandName', label: 'Nom de marque', type: 'text', placeholder: 'OUISTARS' },
      { name: 'tagline', label: 'Signature (footer)', type: 'text', placeholder: 'Premium Mobility & Destination Management' },
      { name: 'phone', label: 'Téléphone', type: 'text', placeholder: '+33 6 51 03 03 06' },
      { name: 'whatsapp', label: 'WhatsApp (numéro international sans +)', type: 'text', placeholder: '33651030306' },
      { name: 'email', label: 'E-mail de contact', type: 'text', placeholder: 'info@ouistars.com' },
      { name: 'address', label: 'Adresse', type: 'textarea' },
      { name: 'hours', label: 'Disponibilité', type: 'text', placeholder: '24/7 — Paris · Côte d’Azur' },
      { name: 'instagram', label: 'Instagram (URL)', type: 'text' },
      { name: 'linkedin', label: 'LinkedIn (URL)', type: 'text' },
      { name: 'footerText', label: 'Texte du footer', type: 'textarea' },
    ],
  },
  rates: {
    key: 'rates', label: 'Tarifs horaires & au kilomètre',
    fields: [
      { name: 'hourlyE', label: 'Horaire E-Class (€/h)', type: 'number' },
      { name: 'hourlyV', label: 'Horaire V-Class (€/h)', type: 'number' },
      { name: 'hourlyS', label: 'Horaire S-Class (€/h)', type: 'number' },
      { name: 'hourlyMin', label: 'Minimum d’heures', type: 'number' },
      { name: 'kmE', label: 'Au km E-Class (€/km)', type: 'number' },
      { name: 'kmV', label: 'Au km V-Class (€/km)', type: 'number' },
      { name: 'kmS', label: 'Au km S-Class (€/km)', type: 'number' },
    ],
  },
  general: {
    key: 'general', label: 'Réglages généraux (obsolète — voir Paramètres du site)',
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
