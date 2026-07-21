// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/i18n';
import { ChauffeurModal } from '@/components/modals/Modals';

/**
 * Candidature chauffeur (Devenez partenaire) :
 * - pièces jointes OBLIGATOIRES → vibration dorée des tuiles manquantes, aucun envoi ;
 * - bascule « Sans véhicule » → 3 pièces au lieu de 7 ;
 * - dépôt complet → create + un doc par pièce + finalize, écran de confirmation.
 */

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const wrap = () => render(<I18nProvider><ChauffeurModal open onClose={() => {}} /></I18nProvider>);

function fillIdentity() {
  fireEvent.change(screen.getByPlaceholderText('Prénom *'), { target: { value: 'Nadia' } });
  fireEvent.change(screen.getByPlaceholderText('Nom *'), { target: { value: 'Bel' } });
  fireEvent.change(screen.getByPlaceholderText('Téléphone *'), { target: { value: '+33600000000' } });
  fireEvent.change(screen.getByPlaceholderText('E-mail *'), { target: { value: 'nadia@ex.com' } });
  fireEvent.change(screen.getByPlaceholderText(/carte professionnelle VTC/), { target: { value: 'VTC-075-9001' } });
}

async function attach(tile: Element, name: string) {
  const input = tile.querySelector('input[type=file]')!;
  const file = new File(['contenu-de-test-suffisamment-long-pour-le-b64-'.repeat(4)], name, { type: 'image/jpeg' });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(tile.className).toContain('is-done'));
}

describe('ChauffeurModal — candidature complète', () => {
  it('pièces manquantes → tuiles en vibration dorée, AUCUN appel réseau', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    wrap();

    expect(document.querySelectorAll('.os-doctile').length).toBe(7); // avec véhicule par défaut
    fillIdentity();
    fireEvent.change(screen.getByPlaceholderText(/Marque/), { target: { value: 'Mercedes' } });
    fireEvent.change(screen.getByPlaceholderText(/Modèle/), { target: { value: 'Classe E' } });
    fireEvent.change(screen.getByPlaceholderText(/Immatriculation/), { target: { value: 'AB-123-CD' } });

    fireEvent.click(screen.getByRole('button', { name: /Déposer ma candidature/ }));
    await waitFor(() => expect(document.querySelector('.os-doctile.os-invalid')).toBeTruthy());
    expect(document.querySelectorAll('.os-doctile.os-invalid').length).toBe(7);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('« Sans véhicule » → 3 pièces seulement, champs véhicule retirés', () => {
    wrap();
    fireEvent.click(screen.getByRole('button', { name: 'Sans véhicule' }));
    expect(document.querySelectorAll('.os-doctile').length).toBe(3);
    expect(screen.queryByPlaceholderText(/Marque/)).toBeNull();
  });

  it('dossier complet → create, un envoi par pièce, finalize, référence affichée', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      calls.push(body);
      const json =
        body.action === 'create' ? { id: '11111111-1111-4111-8111-111111111111', reference: 'CA-TEST7' }
        : body.action === 'doc' ? { ok: true, stored: true }
        : { success: true, reference: 'CA-TEST7' };
      return { ok: true, status: 200, json: async () => json };
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    wrap();
    fireEvent.click(screen.getByRole('button', { name: 'Sans véhicule' }));
    fillIdentity();
    const tiles = [...document.querySelectorAll('.os-doctile')];
    for (const tile of tiles) await attach(tile, 'piece.jpg');

    fireEvent.click(screen.getByRole('button', { name: /Déposer ma candidature/ }));
    await waitFor(() => expect(screen.getByText(/CA-TEST7/)).toBeTruthy());

    // Séquence : 1 create + 3 docs + 1 finalize
    expect(calls.map((c) => c.action)).toEqual(['create', 'doc', 'doc', 'doc', 'finalize']);
    const create = calls[0] as { data: Record<string, string>; vehicle?: unknown };
    expect(create.data).toMatchObject({ first_name: 'Nadia', vtc_card: 'VTC-075-9001' });
    expect(create.vehicle).toBeUndefined();
    const docKeys = calls.filter((c) => c.action === 'doc').map((c) => c.key).sort();
    expect(docKeys).toEqual(['driving_licence', 'profile_photo', 'vtc_card_doc']);
    expect(calls.filter((c) => c.action === 'doc').every((c) => String(c.base64).length > 50)).toBe(true);
  });
});
