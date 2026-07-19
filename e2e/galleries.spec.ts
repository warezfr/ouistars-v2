import { test, expect } from '@playwright/test';
import { installStubs, captureIntake } from './support/stubs';

test.beforeEach(async ({ page }) => {
  await installStubs(page);
  await page.goto('/');
});

test('galerie itinéraires : tout afficher → fiche → réservation préremplie envoyée', async ({ page }) => {
  const captured = await captureIntake(page);

  await page.locator('#tours').scrollIntoViewIfNeeded();
  await page.locator('#tours').getByRole('button', { name: /Tout afficher/ }).click();

  const gal = page.locator('.os-gal');
  await expect(gal).toBeVisible();
  await expect(gal.locator('.os-gal__card')).toHaveCount(6);

  // Fiche Versailles → détail → Réserver → modal préremplie.
  await gal.getByRole('heading', { name: 'Paris ⇄ Versailles' }).click();
  await expect(page.locator('.os-gal')).toBeHidden({ timeout: 2000 }).catch(() => {});
  const dpop = page.locator('.os-dpop');
  await expect(dpop).toBeVisible();
  await expect(dpop.getByText('110 €')).toBeVisible(); // E-Class officiel
  await dpop.getByRole('button', { name: 'Réserver' }).click();

  const modal = page.locator('.os-modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('input[name="prefill"]')).toHaveValue(/Versailles/);

  // Envoi complet.
  await modal.getByPlaceholder('Prénom').fill('Jean');
  await modal.getByPlaceholder('Nom', { exact: true }).fill('E2E');
  await modal.getByPlaceholder('Téléphone').fill('+33600000000');
  await modal.locator('input[name="travel_date"]').fill('2030-06-15');
  await modal.getByPlaceholder('Départ').fill('Paris');
  await modal.getByPlaceholder('Destination').fill('Versailles');
  await modal.getByRole('button', { name: 'Envoyer' }).click();

  await expect(modal.getByText(/réf\./)).toBeVisible();
  expect(captured.bodies[0]).toMatchObject({ type: 'booking', channel: 'siteweb' });
});

test('galerie corporate : carte featured, micro-labels, fiche détail', async ({ page }) => {
  await page.locator('#corporate').scrollIntoViewIfNeeded();
  await page.locator('#corporate').getByRole('button', { name: /Tout afficher/ }).click();

  const gal = page.locator('.os-gal');
  await expect(gal).toBeVisible();
  await expect(gal.locator('.os-gal__card')).toHaveCount(6);
  await expect(gal.locator('.os-gal__card--feat')).toHaveCount(1);
  await expect(gal.getByText('Protocole & préséances →')).toBeVisible();
  await expect(gal.getByText('FBO · Le Bourget →')).toBeVisible();

  await gal.getByRole('heading', { name: 'Comptes Entreprises' }).click();
  const dpop = page.locator('.os-dpop');
  await expect(dpop).toBeVisible();
  await expect(dpop.getByText(/Facturation centralisée/)).toBeVisible();
});

test('échap et voile ferment la galerie', async ({ page }) => {
  await page.locator('#tours').scrollIntoViewIfNeeded();
  await page.locator('#tours').getByRole('button', { name: /Tout afficher/ }).click();
  await expect(page.locator('.os-gal')).toBeVisible();
  await page.locator('.os-gal').click({ position: { x: 8, y: 8 } }); // voile
  await expect(page.locator('.os-gal')).toBeHidden();
});
