/** Modèle générique de contenu piloté par configuration (CMS). */
export type FieldType =
  | 'text' | 'textarea' | 'richtext' | 'number' | 'boolean' | 'image' | 'select'
  | 'repeater' | 'ref' | 'date';

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  help?: string;
  placeholder?: string;
  /** Sous-champs pour le type « repeater » (liste d'objets). */
  subfields?: Field[];
  /** Champ des sous-objets servant de libellé de ligne (repeater). */
  itemLabel?: string;
  /** Pour le type « ref » : collection cible et champ affiché comme libellé. */
  refCollection?: string;
  refLabelField?: string;
}

export interface Collection {
  /** Clé stockée dans cms_entries.collection */
  key: string;
  label: string;          // pluriel (liste)
  singular: string;       // singulier (bouton « Ajouter »)
  /** Champ de `data` servant de libellé dans la liste (défaut : title/name/fr/q). */
  titleField?: string;
  /** Champ image affiché en vignette dans la liste. */
  thumbField?: string;
  fields: Field[];
}

/** Entrée telle que renvoyée par Supabase. */
export interface CmsEntry {
  id: string;
  collection: string;
  slug: string | null;
  title: string | null;
  status: 'draft' | 'published';
  position: number;
  locale: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
