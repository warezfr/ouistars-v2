import { test, expect } from '@playwright/test';
import { installStubs } from './support/stubs';

test.beforeEach(async ({ page }) => {
  await installStubs(page);
  await page.goto('/');
});

test('la page d’accueil charge toutes les sections clés', async ({ page }) => {
  await expect(page.locator('#top')).toBeVisible();
  for (const id of ['#dmc', '#meet-greet', '#fleet', '#tours', '#tarifs', '#corporate', '#about', '#faq', '#contact']) {
    await expect(page.locator(id).first()).toBeAttached();
  }
  // Hero : CTA or vers les destinations + calculateur présent.
  await expect(page.getByRole('link', { name: /Découvrir nos destinations/i })).toBeVisible();
  await expect(page.locator('.os-calc')).toBeVisible();
});

test('bascule FR → EN : navigation et hero traduits', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Réserver' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page.getByText('Premium Mobility & Event Solutions')).toBeVisible();
  await expect(page.getByRole('link', { name: /Discover our destinations/i })).toBeVisible();
});

test('footer colophon : invitation, registre, signature, légal dégagé', async ({ page }) => {
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.getByText('Où pouvons-nous vous conduire ?')).toBeVisible();
  await expect(page.locator('.os-footer__sig span')).toHaveText(/OUISTARS/);
  // Les liens légaux ne passent pas sous le majordome WhatsApp fixe.
  const legal = page.locator('.os-footer__legal');
  const wa = page.locator('.os-wa');
  const [lb, wb] = [await legal.boundingBox(), await wa.boundingBox()];
  expect(lb && wb && lb.x + lb.width <= wb.x).toBeTruthy();
});

test('destinations : mosaïque sans aucun prix, fiche au clic avec Réserver', async ({ page }) => {
  await page.locator('#tarifs').scrollIntoViewIfNeeded();
  const dst = page.locator('#tarifs');
  await expect(dst.locator('.os-dst__tile')).toHaveCount(9);
  expect(await dst.textContent()).not.toMatch(/\d+\s*€/); // zéro prix affiché

  // Clic sur Monaco → fiche avec description et bouton Réserver.
  await dst.locator('.os-dst__tile', { hasText: 'Monaco' }).click();
  const dpop = page.locator('.os-dpop');
  await expect(dpop).toBeVisible();
  await expect(dpop.getByText(/corniche/)).toBeVisible();
  await dpop.getByRole('button', { name: 'Réserver' }).click();
  await expect(page.locator('.os-modal input[name="prefill"]')).toHaveValue(/Monaco/);
});
