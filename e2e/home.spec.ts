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
  // Hero : CTA or vers la grille + calculateur présent.
  await expect(page.getByRole('link', { name: /grille tarifaire complète/i })).toBeVisible();
  await expect(page.locator('.os-calc')).toBeVisible();
});

test('bascule FR → EN : navigation et hero traduits', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Réserver' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page.getByText('Premium Mobility & Event Solutions')).toBeVisible();
  await expect(page.getByRole('link', { name: /full rate card/i })).toBeVisible();
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

test('grille tarifaire : prix officiels affichés (City-to-city en premier)', async ({ page }) => {
  await page.locator('#tarifs').scrollIntoViewIfNeeded();
  await expect(page.locator('#tarifs').getByRole('tab', { name: 'City-to-city depuis Paris' })).toBeVisible();
  await expect(page.locator('#tarifs').getByText('Paris ⇄ Mont-Saint-Michel')).toBeVisible();
  await expect(page.locator('#tarifs').getByText('1 620 €')).toBeVisible(); // S-Class Mont-Saint-Michel
});
