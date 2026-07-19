import { describe, it, expect } from 'vitest';
import { fr } from '@/i18n/fr';
import { en } from '@/i18n/en';

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

describe('dictionnaires i18n', () => {
  it('fr et en ont exactement la même arborescence de clés', () => {
    expect(shape(en)).toEqual(shape(fr));
  });

  it('aucune chaîne vide dans fr', () => {
    expect(emptyStrings(fr)).toEqual([]);
  });

  it('aucune chaîne vide dans en', () => {
    expect(emptyStrings(en)).toEqual([]);
  });
});
