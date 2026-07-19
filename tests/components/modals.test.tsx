// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/i18n';
import { BookingModal, QuoteModal, WhatsAppCTA } from '@/components/modals/Modals';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const wrap = (ui: React.ReactElement) => render(<I18nProvider>{ui}</I18nProvider>);

function fillBooking() {
  fireEvent.change(screen.getByPlaceholderText('Prénom'), { target: { value: 'Jean' } });
  fireEvent.change(screen.getByPlaceholderText('Nom'), { target: { value: 'Client' } });
  fireEvent.change(screen.getByPlaceholderText('Téléphone'), { target: { value: '+33600000000' } });
  fireEvent.change(document.querySelector('input[name="travel_date"]')!, { target: { value: '2030-06-15' } });
  fireEvent.change(screen.getByPlaceholderText('Départ'), { target: { value: 'CDG' } });
  fireEvent.change(screen.getByPlaceholderText('Destination'), { target: { value: 'Paris' } });
}

describe('BookingModal', () => {
  it('soumission → POST /api/intake, écran de référence', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    wrap(<BookingModal open onClose={() => {}} />);
    fillBooking();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    await waitFor(() => expect(screen.getByText(/réf\./)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/intake');
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.type).toBe('booking');
    expect(payload.channel).toBe('siteweb');
    expect(payload.data.first_name).toBe('Jean');
  });

  it('échec réseau → message d’erreur, formulaire conservé', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    wrap(<BookingModal open onClose={() => {}} />);
    fillBooking();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    await waitFor(() => expect(screen.getByText(/Erreur/)).toBeTruthy());
    // Le champ reste rempli — pas de perte de saisie.
    expect((screen.getByPlaceholderText('Prénom') as HTMLInputElement).value).toBe('Jean');
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
  it('soumission devis → type quote', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    wrap(<QuoteModal open onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Société'), { target: { value: 'ACME' } });
    fireEvent.change(screen.getByPlaceholderText('Contact'), { target: { value: 'Jean' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'j@acme.fr' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string).type).toBe('quote');
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
