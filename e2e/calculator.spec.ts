import { test, expect } from '@playwright/test';
import { installStubs } from './support/stubs';

test('calculateur hero : géocodage → estimation aux prix officiels → wizard', async ({ page }) => {
  await installStubs(page);
  await page.goto('/');

  const calc = page.locator('.os-calc');
  const search = calc.getByRole('button', { name: 'Rechercher' });
  await expect(search).toBeDisabled();

  // Départ : « cdg » → suggestion aéroport (Photon stub).
  const from = calc.getByPlaceholder(/Aéroport, gare, adresse/);
  await from.click();
  await from.fill('cdg');
  await calc.locator('.os-ac__item').first().click();

  // Destination : Champs-Élysées.
  const to = calc.getByPlaceholder('Où allez-vous ?');
  await to.click();
  await to.fill('champs');
  await calc.locator('.os-ac__item').first().click();

  // Estimation : 29 km (OSRM stub) + prix grille CDG⇄Paris (zone fixe).
  await expect(calc.getByText('≈ 29 km')).toBeVisible();
  const prices = calc.locator('.os-calc__price-val');
  await expect(prices).toHaveCount(3);
  await expect(prices.nth(0)).toHaveText('120 €'); // E — grille officielle
  await expect(prices.nth(2)).toHaveText('210 €'); // S

  // Rechercher → wizard de réservation.
  await expect(search).toBeEnabled();
  await search.click();
  await expect(page.locator('.osw__panel')).toBeVisible();
});
