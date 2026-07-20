// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { I18nProvider } from '@/i18n';
import Packages from '@/components/home/Packages';
import { Events } from '@/components/home/Editorial';
import { ROUTE_RATES } from '@/data/pricing';

vi.mock('@/lib/supabase', () => ({ supabase: null }));

const wrap = (ui: React.ReactElement) => render(<I18nProvider>{ui}</I18nProvider>);

describe('Packages — galerie « Tout afficher » des itinéraires', () => {
  it('bouton avec compteur → ouvre la galerie de 6 fiches complètes', () => {
    wrap(<Packages onBook={() => {}} />);
    const btn = screen.getByRole('button', { name: /Tout afficher/ });
    expect(btn.textContent).toContain('06');

    fireEvent.click(btn);
    const gal = document.querySelector('.os-gal')!;
    expect(gal).toBeTruthy();
    expect(gal.querySelectorAll('.os-gal__card')).toHaveLength(6);

    // Chaque carte porte une description et le CTA Réserver — mais AUCUN prix.
    const versailles = ROUTE_RATES.find((r) => r.id === 'paris-versailles')!;
    const card = within(gal as HTMLElement).getByText(versailles.label).closest('.os-gal__card')!;
    expect(card.textContent).toContain('Versailles à 40 minutes');
    expect(card.textContent).toContain('Réserver');
    expect(card.textContent).not.toMatch(/\d+\s*€/);
    expect(gal.querySelectorAll('.os-gal__prices')).toHaveLength(0);
  });

  it('clic sur une carte → ferme la galerie et ouvre la fiche détail', () => {
    wrap(<Packages onBook={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Tout afficher/ }));
    const gal = document.querySelector('.os-gal')!;
    const firstCard = gal.querySelector('.os-gal__card')!;
    fireEvent.click(firstCard);

    expect(document.querySelector('.os-gal')).toBeNull(); // galerie fermée
    expect(document.querySelector('.os-dpop')).toBeTruthy(); // fiche ouverte
  });

  it('clic sur le voile → ferme la galerie', () => {
    wrap(<Packages onBook={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Tout afficher/ }));
    fireEvent.click(document.querySelector('.os-gal')!);
    expect(document.querySelector('.os-gal')).toBeNull();
  });

  it('fiche détail sans prix : Réserver transmet le trajet prérempli', () => {
    const onBook = vi.fn();
    wrap(<Packages onBook={onBook} />);
    // Ouvre la fiche via le rail (première carte).
    fireEvent.click(document.querySelector('.os-pk__card')!);
    const dpop = document.querySelector('.os-dpop') as HTMLElement;
    expect(dpop).toBeTruthy();
    expect(dpop.querySelector('.os-dpop__rates')).toBeNull(); // plus de tarifs
    expect(dpop.textContent).not.toMatch(/\d+\s*€/);
    fireEvent.click(within(dpop).getByRole('button', { name: /Réserver/ }));
    expect(onBook).toHaveBeenCalledWith(expect.stringContaining('⇄'));
    expect(document.querySelector('.os-dpop')).toBeNull(); // fermée après action
  });
});

describe('Events → Corporate — galerie des partenariats', () => {
  it('galerie : 6 expertises, micro-labels distincts (pas de « En savoir plus » ×6)', () => {
    wrap(<Events onQuote={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Tout afficher/ }));

    const gal = document.querySelector('.os-gal')!;
    const cards = gal.querySelectorAll('.os-gal__card');
    expect(cards).toHaveLength(6);

    const labels = [...gal.querySelectorAll('.os-gal__more')].map((el) => el.textContent);
    expect(new Set(labels).size).toBe(6); // tous distincts
    expect(labels.join(' ')).toContain('Protocole');

    // Première carte = featured (composition magazine).
    expect(cards[0].classList.contains('os-gal__card--feat')).toBe(true);
  });

  it('carte → fiche détail avec description intégrale, CTA → devis', () => {
    const onQuote = vi.fn();
    wrap(<Events onQuote={onQuote} />);
    fireEvent.click(screen.getByRole('button', { name: /Tout afficher/ }));
    fireEvent.click(document.querySelector('.os-gal__card')!);

    const dpop = document.querySelector('.os-dpop') as HTMLElement;
    expect(dpop.textContent).toContain('Ambassades');
    expect(dpop.textContent).toContain('cortèges coordonnés');

    fireEvent.click(within(dpop).getByRole('button', { name: /Solutions Entreprises/i }));
    expect(onQuote).toHaveBeenCalled();
    expect(document.querySelector('.os-dpop')).toBeNull(); // fermée après action
  });
});
