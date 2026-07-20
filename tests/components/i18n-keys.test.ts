import { describe, it, expect } from 'vitest';
import { fr } from '@/i18n/fr';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';
import { ru } from '@/i18n/ru';
import { ar } from '@/i18n/ar';

/** Isomorphisme FR/EN (faille n° 5 de l'audit) : mêmes clés, mêmes formes,
    mêmes longueurs de tableaux — aucune traduction manquante possible. */
function shape(o: unknown): unknown {
  if (Array.isArray(o)) return { __array: o.length, item: o.length ? shape(o[0]) : null };
  if (o && typeof o === 'object') {
    return Object.fromEntries(
      Object.entries(o as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, shape(v)]),
    );
  }
  return typeof o;
}

function emptyStrings(o: unknown, path = ''): string[] {
  if (typeof o === 'string') return o.trim() === '' ? [path] : [];
  if (Array.isArray(o)) return o.flatMap((v, i) => emptyStrings(v, `${path}[${i}]`));
  if (o && typeof o === 'object') {
    return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => emptyStrings(v, path ? `${path}.${k}` : k));
  }
  return [];
}

describe('dictionnaires i18n — 5 langues', () => {
  const DICTS = { fr, en, es, ru, ar } as const;

  it.each(Object.keys(DICTS).filter((k) => k !== 'fr'))('%s a exactement la même arborescence que fr', (k) => {
    expect(shape(DICTS[k as keyof typeof DICTS])).toEqual(shape(fr));
  });

  it.each(Object.keys(DICTS))('aucune chaîne vide dans %s', (k) => {
    expect(emptyStrings(DICTS[k as keyof typeof DICTS])).toEqual([]);
  });
});
