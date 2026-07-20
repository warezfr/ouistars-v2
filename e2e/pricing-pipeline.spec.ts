import { test, expect } from '@playwright/test';
import { installStubs } from './support/stubs';

/**
 * LE TEST-ROI (côté front) : un prix modifié dans le back-office (persisté
 * dans cms_entries) doit piloter le seul endroit où un montant apparaît
 * encore — l'estimation du calculateur hero. Le reste de la vitrine
 * (itinéraires, destinations) n'affiche plus aucun prix, par choix éditorial.
 * Ici : Aéroports ⇄ Paris passe de 120 € à 137 € (E-Class) côté back-office.
 */
const EDITED = [
  { data: { routeId: 'cdg-ory-lbg-paris', label: 'Aéroports Paris (CDG • ORY • LBG) ⇄ Paris', category: 'airport', priceE: 137, priceV: 149, priceS: 233 }, position: 0 },
  { data: { routeId: 'paris-versailles', label: 'Paris ⇄ Versailles', category: 'tour', priceE: 115, priceV: 125, priceS: 195 }, position: 1 },
  { data: { routeId: 'paris-disneyland', label: 'Paris ⇄ Disneyland', category: 'tour', priceE: 150, priceV: 170, priceS: 210 }, position: 2 },
  { data: { routeId: 'nce-monaco', label: 'Nice (NCE) ⇄ Monaco', category: 'riviera', priceE: 200, priceV: 220, priceS: 250 }, position: 3 },
  { data: { routeId: 'nice-st-tropez', label: 'Nice ⇄ Saint-Tropez', category: 'riviera', priceE: 350, priceV: 370, priceS: 450 }, position: 4 },
  { data: { routeId: 'paris-mont-saint-michel', label: 'Paris ⇄ Mont-Saint-Michel', category: 'city-to-city', priceE: 1260, priceV: 1260, priceS: 1620 }, position: 5 },
];

test('un prix édité en back-office pilote l’estimation du calculateur', async ({ page }) => {
  await installStubs(page, { cmsRoutes: EDITED, cmsRates: { hourlyE: 85 } });
  await page.goto('/');

  // 1. Les vitrines n'affichent plus aucun prix (itinéraires + destinations).
  await page.locator('#tours').scrollIntoViewIfNeeded();
  await page.locator('#tours').getByRole('button', { name: /Tout afficher/ }).click();
  const gal = page.locator('.os-gal');
  await expect(gal.locator('.os-gal__card', { hasText: 'Paris ⇄ Versailles' })).toBeVisible();
  await expect(gal.locator('.os-gal__prices')).toHaveCount(0);
  await gal.click({ position: { x: 8, y: 8 } });

  await page.locator('#tarifs').scrollIntoViewIfNeeded();
  expect(await page.locator('#tarifs').textContent()).not.toMatch(/\d+\s*€/);

  // 2. Le calculateur hero, lui, reflète le prix édité en back-office :
  //    CDG → Paris (zone grille) doit afficher 137 € — plus jamais 120 €.
  await page.locator('#top').scrollIntoViewIfNeeded();
  const calc = page.locator('.os-calc');
  const from = calc.getByPlaceholder(/Aéroport, gare, adresse/);
  await from.click();
  await from.fill('cdg');
  await calc.locator('.os-ac__item').first().click();
  const to = calc.getByPlaceholder('Où allez-vous ?');
  await to.click();
  await to.fill('champs');
  await calc.locator('.os-ac__item').first().click();

  const prices = calc.locator('.os-calc__price-val');
  await expect(prices.nth(0)).toHaveText('137 €');
  await expect(prices.nth(2)).toHaveText('233 €');
  await expect(calc.getByText('120 €')).toHaveCount(0);
});
