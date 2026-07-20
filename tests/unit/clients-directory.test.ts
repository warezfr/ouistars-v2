import { describe, it, expect } from 'vitest';
import { normPhone, clientKey, matchClient, type DirectoryClient } from '@/admin/lib/clients';

/**
 * Annuaire clients (saisie assistée devis/factures) — logique pure :
 * normalisation des téléphones, clé de dédoublonnage, rapprochement d'une saisie.
 */

const dc = (p: Partial<DirectoryClient> & { name: string }): DirectoryClient => ({
  key: clientKey(p), bookings: 0, total: 0, lastDate: '', sources: [], ...p,
});

describe('normPhone', () => {
  it('+33, 0 initial, espaces et points sont équivalents', () => {
    expect(normPhone('+33 6 51 03 03 06')).toBe('651030306');
    expect(normPhone('06.51.03.03.06')).toBe('651030306');
    expect(normPhone('0651030306')).toBe('651030306');
    expect(normPhone('0033651030306')).toBe('651030306');
  });
  it('vide / null → chaîne vide', () => {
    expect(normPhone('')).toBe('');
    expect(normPhone(undefined)).toBe('');
  });
});

describe('clientKey', () => {
  it("priorité : e-mail > téléphone > nom, insensible à la casse", () => {
    expect(clientKey({ email: 'Jean@Ex.com', phone: '0600000001', name: 'Jean' })).toBe('e:jean@ex.com');
    expect(clientKey({ phone: '+33 6 00 00 00 01', name: 'Jean' })).toBe('p:600000001');
    expect(clientKey({ name: 'Jean Dupont' })).toBe('n:jean dupont');
  });
});

describe('matchClient (rapprochement de la saisie)', () => {
  const list = [
    dc({ id: 'u1', name: 'Amel Karim', email: 'amel@ex.com', phone: '+33 6 11 22 33 44' }),
    dc({ name: 'Sans Fiche', phone: '0655667788' }),
  ];

  it("retrouve par e-mail (casse ignorée) même si le nom diffère", () => {
    expect(matchClient(list, { name: 'A. K.', email: 'AMEL@ex.com' })?.id).toBe('u1');
  });
  it('retrouve par téléphone (formats différents)', () => {
    expect(matchClient(list, { name: 'X', phone: '06.55.66.77.88' })?.name).toBe('Sans Fiche');
    expect(matchClient(list, { name: 'X', phone: '+33 6 11 22 33 44' })?.id).toBe('u1');
  });
  it("l'e-mail prime sur le téléphone ; aucun contact → pas de rapprochement", () => {
    expect(matchClient(list, { name: 'X', email: 'amel@ex.com', phone: '0655667788' })?.id).toBe('u1');
    expect(matchClient(list, { name: 'Amel Karim' })).toBeUndefined();
  });
});
