// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/i18n';
import { BookingModal, QuoteModal, WhatsAppCTA } from '@/components/modals/Modals';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const wrap = (ui: React.ReactElement) => render(<I18nProvider>{ui}</I18nProvider>);

function fillBooking(withEmail = true) {
  fireEvent.change(screen.getByPlaceholderText('Prénom *'), { target: { value: 'Jean' } });
  fireEvent.change(screen.getByPlaceholderText('Nom *'), { target: { value: 'Client' } });
  fireEvent.change(screen.getByPlaceholderText('Téléphone *'), { target: { value: '+33600000000' } });
  if (withEmail) fireEvent.change(screen.getByPlaceholderText('E-mail *'), { target: { value: 'jean@ex.fr' } });
  // Date via le calendrier custom : ouvrir le popover puis choisir un jour actif.
  fireEvent.click(document.querySelector('.os-form__pickers .osp-field')!);
  const cells = document.querySelectorAll('.osp-cell:not(.is-disabled):not(.osp-cell--empty)');
  fireEvent.click(cells[cells.length - 1]);
  fireEvent.change(screen.getByPlaceholderText('Départ *'), { target: { value: 'CDG' } });
  fireEvent.change(screen.getByPlaceholderText('Destination *'), { target: { value: 'Paris' } });
}

describe('BookingModal', () => {
  it('envoi par e-mail → POST /api/intake (channel siteweb), écran de référence', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reference: 'WEB-TEST1' }) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    wrap(<BookingModal open onClose={() => {}} />);
    fillBooking();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer par e-mail' }));

    await waitFor(() => expect(screen.getByText(/réf\./)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/intake');
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.type).toBe('booking');
    expect(payload.channel).toBe('siteweb');
    expect(payload.data.first_name).toBe('Jean');
  });

  it('envoi par WhatsApp → capture back-office (channel whatsapp) + ouverture wa.me', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reference: 'WEB-TEST2' }) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const openMock = vi.fn();
    vi.stubGlobal('open', openMock);

    wrap(<BookingModal open onClose={() => {}} />);
    fillBooking(false); // e-mail non requis pour le canal WhatsApp
    fireEvent.click(screen.getByRole('button', { name: /Envoyer par WhatsApp/ }));

    await waitFor(() => expect(openMock).toHaveBeenCalled());
    const wa = openMock.mock.calls[0][0] as string;
    expect(wa).toContain('wa.me/33651030306');
    expect(decodeURIComponent(wa)).toContain('CDG → Paris');
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string).channel).toBe('whatsapp');
    vi.unstubAllGlobals();
  });

  it('champ requis manquant → vibration dorée (os-invalid), aucun envoi', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    wrap(<BookingModal open onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer par e-mail' }));

    const prenom = screen.getByPlaceholderText('Prénom *');
    expect(prenom.classList.contains('os-invalid')).toBe(true);
    expect(screen.getByPlaceholderText('E-mail *').classList.contains('os-invalid')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();

    // La saisie efface la vibration.
    fireEvent.input(prenom, { target: { value: 'J' } });
    expect(prenom.classList.contains('os-invalid')).toBe(false);
  });

  it('e-mail requis pour le canal e-mail, pas pour WhatsApp', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    vi.stubGlobal('open', vi.fn());

    wrap(<BookingModal open onClose={() => {}} />);
    fillBooking(false);
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer par e-mail' }));
    expect(screen.getByPlaceholderText('E-mail *').classList.contains('os-invalid')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Envoyer par WhatsApp/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    vi.unstubAllGlobals();
  });

  it('échec réseau (e-mail) → message d’erreur, formulaire conservé', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    wrap(<BookingModal open onClose={() => {}} />);
    fillBooking();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer par e-mail' }));
    await waitFor(() => expect(screen.getByText(/Erreur/)).toBeTruthy());
    // Le champ reste rempli — pas de perte de saisie.
    expect((screen.getByPlaceholderText('Prénom *') as HTMLInputElement).value).toBe('Jean');
  });

  it('préremplissage affiché en lecture seule', () => {
    wrap(<BookingModal open prefill="Paris ⇄ Versailles" onClose={() => {}} />);
    const pre = document.querySelector('input[name="prefill"]') as HTMLInputElement;
    expect(pre.value).toBe('Paris ⇄ Versailles');
    expect(pre.readOnly).toBe(true);
  });

  it('Échap ferme la modale', () => {
    const onClose = vi.fn();
    wrap(<BookingModal open onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('open=false → rien dans le DOM', () => {
    wrap(<BookingModal open={false} onClose={() => {}} />);
    expect(document.querySelector('.os-modal')).toBeNull();
  });
});

describe('QuoteModal', () => {
  it('envoi devis par e-mail → type quote', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reference: 'WEB-Q1' }) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    wrap(<QuoteModal open onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Société *'), { target: { value: 'ACME' } });
    fireEvent.change(screen.getByPlaceholderText('Contact *'), { target: { value: 'Jean' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail *'), { target: { value: 'j@acme.fr' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer par e-mail' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string).type).toBe('quote');
  });

  it('WhatsApp exige le téléphone → vibration si absent', () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    wrap(<QuoteModal open onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Société *'), { target: { value: 'ACME' } });
    fireEvent.change(screen.getByPlaceholderText('Contact *'), { target: { value: 'Jean' } });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer par WhatsApp/ }));
    expect(screen.getByPlaceholderText('Téléphone *').classList.contains('os-invalid')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('WhatsAppCTA (majordome)', () => {
  it('lien wa.me correct, nouvel onglet sécurisé', () => {
    wrap(<WhatsAppCTA />);
    const a = screen.getByLabelText('Conciergerie WhatsApp') as HTMLAnchorElement;
    expect(a.href).toContain('wa.me/33651030306');
    expect(a.target).toBe('_blank');
    expect(a.rel).toContain('noreferrer');
  });
});
