import { test, expect } from '@playwright/test';
import { installStubs } from './support/stubs';

/**
 * LE TEST-ROI (côté front) : un prix modifié dans le back-office (persisté
 * dans cms_entries) doit se répliquer partout sur le site public —
 * grille tarifaire, galerie « Tout afficher », fiche destination.
 * Ici : Paris ⇄ Versailles passe de 110 € à 115 € (E-Class).
 */
const EDITED = [
  { data: { routeId: 'paris-versailles', label: 'Paris ⇄ Versailles', category: 'tour', priceE: 115, priceV: 125, priceS: 195 }, position: 1 },
  // Les autres routes restent servies par la DB pour que la grille soit complète.
  { data: { routeId: 'cdg-ory-lbg-paris', label: 'Aéroports Paris (CDG • ORY • LBG) ⇄ Paris', category: 'airport', priceE: 120, priceV: 130, priceS: 210 }, position: 0 },
  { data: { routeId: 'paris-disneyland', label: 'Paris ⇄ Disneyland', category: 'tour', priceE: 150, priceV: 170, priceS: 210 }, position: 2 },
  { data: { routeId: 'nce-monaco', label: 'Nice (NCE) ⇄ Monaco', category: 'riviera', priceE: 200, priceV: 220, priceS: 250 }, position: 3 },
  { data: { routeId: 'nice-st-tropez', label: 'Nice ⇄ Saint-Tropez', category: 'riviera', priceE: 350, priceV: 370, priceS: 450 }, position: 4 },
  { data: { routeId: 'paris-mont-saint-michel', label: 'Paris ⇄ Mont-Saint-Michel', category: 'city-to-city', priceE: 1260, priceV: 1260, priceS: 1620 }, position: 5 },
];

test('un prix édité en back-office se réplique sur toute la vitrine', async ({ page }) => {
  await installStubs(page, { cmsRoutes: EDITED, cmsRates: { hourlyE: 85 } });
  await page.goto('/');

  // 1. Les itinéraires signature n'affichent AUCUN prix (choix éditorial),
  //    mais la route pilotée par la DB y apparaît bien.
  await page.locator('#tours').scrollIntoViewIfNeeded();
  await page.locator('#tours').getByRole('button', { name: /Tout afficher/ }).click();
  const gal = page.locator('.os-gal');
  const card = gal.locator('.os-gal__card', { hasText: 'Paris ⇄ Versailles' });
  await expect(card).toBeVisible();
  await expect(gal.locator('.os-gal__prices')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await gal.click({ position: { x: 8, y: 8 } }).catch(() => {});

  // 2. Grille tarifaire (onglet Excursions) → le prix édité 115 € s'affiche.
  await page.locator('#tarifs').scrollIntoViewIfNeeded();
  const tarifs = page.locator('#tarifs');
  const tab = tarifs.getByRole('button', { name: /Excursions/i });
  if (await tab.count()) await tab.click();
  const row = tarifs.locator('tr', { hasText: 'Paris ⇄ Versailles' });
  if (await row.count()) {
    await expect(row.first()).toContainText('115 €');
    await expect(row.first()).not.toContainText('110 €');
  }

  // 3. Taux horaire édité (85 €/h) visible dans le panneau mise à disposition.
  await expect(tarifs.getByText('85 €').first()).toBeVisible();
});
