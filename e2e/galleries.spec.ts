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

  // Aucun prix dans la galerie ni la fiche — descriptions + Réserver seulement.
  await expect(gal.locator('.os-gal__prices')).toHaveCount(0);

  // Fiche Versailles → détail → Réserver → modal préremplie.
  await gal.getByRole('heading', { name: 'Paris ⇄ Versailles' }).click();
  const dpop = page.locator('.os-dpop');
  await expect(dpop).toBeVisible();
  await expect(dpop.getByText(/40 minutes de Paris/)).toBeVisible();
  await expect(dpop.locator('.os-dpop__rates')).toHaveCount(0);
  await dpop.getByRole('button', { name: 'Réserver' }).click();

  const modal = page.locator('.os-modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('input[name="prefill"]')).toHaveValue(/Versailles/);

  // Champs requis vides → vibration dorée, aucun envoi.
  await modal.getByRole('button', { name: 'Envoyer par e-mail' }).click();
  await expect(modal.getByPlaceholder('Prénom *')).toHaveClass(/os-invalid/);
  expect(captured.bodies).toHaveLength(0);

  // Envoi complet par e-mail (e-mail requis pour ce canal).
  await modal.getByPlaceholder('Prénom *').fill('Jean');
  await modal.getByPlaceholder('Nom *', { exact: true }).fill('E2E');
  await modal.getByPlaceholder('Téléphone *').fill('+33600000000');
  await modal.getByPlaceholder('E-mail *').fill('jean@e2e.fr');
  await modal.locator('.osp-field').first().click();
  const cal = modal.locator('.osp-pop--cal');
  await cal.getByRole('button', { name: /Mois suivant|Next month/ }).click();
  await cal.locator('.osp-cell:not(.is-disabled)', { hasText: /^15$/ }).first().click();
  await modal.getByPlaceholder('Départ *').fill('Paris');
  await modal.getByPlaceholder('Destination *').fill('Versailles');
  await modal.getByRole('button', { name: 'Envoyer par e-mail' }).click();

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
