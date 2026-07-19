// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/i18n';
import { formatEUR } from '@/lib/pricing';

/** Géocodage mocké : pas de réseau, réponses déterministes. */
const PLACES = vi.hoisted(() => ({
  cdg: { id: 'p-cdg', label: 'Aéroport Charles de Gaulle (CDG)', sub: 'Roissy', type: 'airport', lat: 49.0097, lng: 2.5479 },
  paris: { id: 'p-paris', label: 'Champs-Élysées, Paris', sub: 'Paris 8e', type: 'landmark', lat: 48.8718, lng: 2.304 },
}));
const ESTIMATE = vi.hoisted(() => ({
  basis: 'fixed-route', distanceKm: 29,
  prices: { E: 120, V: 130, S: 210 },
  routeLabel: 'Aéroports Paris (CDG • ORY • LBG) ⇄ Paris', routeId: 'cdg-ory-lbg-paris',
}));

vi.mock('@/lib/geocode', () => ({
  geocodeSearch: vi.fn(async (q: string) =>
    q.toLowerCase().includes('cdg') ? [PLACES.cdg] : q ? [PLACES.paris] : []),
  estimatePlaces: vi.fn(async () => ESTIMATE),
  geolocate: vi.fn(async () => PLACES.paris),
  roadDistanceKm: vi.fn(async () => 29),
  reverseGeocode: vi.fn(async () => PLACES.paris),
}));
vi.mock('@/lib/supabase', () => ({ supabase: null }));
// Le wizard complet est testé à part — on l'isole ici.
vi.mock('@/components/booking/BookingWizard', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div data-testid="wizard-open" /> : null),
}));

import FareCalculator from '@/components/home/FareCalculator';

const wrap = () => render(<I18nProvider><FareCalculator /></I18nProvider>);

async function pick(placeholderPart: string, query: string, optionLabel: string) {
  const input = screen.getByPlaceholderText(new RegExp(placeholderPart, 'i'));
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: query } });
  const option = await screen.findByRole('button', { name: new RegExp(optionLabel, 'i') }, { timeout: 2000 });
  fireEvent.click(option);
}

describe('FareCalculator', () => {
  it('« Rechercher » désactivé tant que départ + destination ne sont pas choisis', () => {
    wrap();
    expect((screen.getByRole('button', { name: /Rechercher/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('départ + destination → estimation avec les 3 prix officiels', async () => {
    wrap();
    await pick('gare, adresse', 'cdg', 'Charles de Gaulle');
    await pick('allez-vous', 'champs', 'Champs-Élysées');

    await waitFor(() => expect(screen.getByText(`≈ 29 km`)).toBeTruthy());
    const shown = [...document.querySelectorAll('.os-calc__price-val')].map((el) => el.textContent);
    for (const cls of ['E', 'V', 'S'] as const) {
      expect(shown).toContain(formatEUR(ESTIMATE.prices[cls]));
    }

    const search = screen.getByRole('button', { name: /Rechercher/ }) as HTMLButtonElement;
    expect(search.disabled).toBe(false);
    fireEvent.click(search);
    expect(screen.getByTestId('wizard-open')).toBeTruthy();
  });

  it('aucun résultat → message dédié', async () => {
    wrap();
    const input = screen.getByPlaceholderText(/gare, adresse/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    await waitFor(() => expect(document.querySelector('.os-ac__empty')).toBeTruthy(), { timeout: 2000 });
  });
});
