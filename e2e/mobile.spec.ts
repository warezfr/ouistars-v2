import { test, expect } from '@playwright/test';
import { installStubs } from './support/stubs';

test.beforeEach(async ({ page }) => {
  await installStubs(page);
  await page.goto('/');
});

test('mobile : aucun débordement horizontal sur toute la page', async ({ page }) => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  const { scrollW, innerW } = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  }));
  expect(scrollW).toBeLessThanOrEqual(innerW + 1);
});

test('mobile : hero, calculateur et footer utilisables', async ({ page }) => {
  await expect(page.locator('.os-calc')).toBeVisible();
  await expect(page.locator('.os-calc').getByRole('button', { name: 'Rechercher' })).toBeVisible();

  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.getByText('Où pouvons-nous vous conduire ?')).toBeVisible();
  // La ligne légale n'est pas recouverte par le majordome (padding réservé).
  await expect(page.locator('.os-footer__legal')).toBeVisible();
});

test('mobile : galerie tout afficher en une colonne, fermeture au voile', async ({ page }) => {
  await page.locator('#tours').scrollIntoViewIfNeeded();
  await page.locator('#tours').getByRole('button', { name: /Tout afficher/ }).click();
  const gal = page.locator('.os-gal');
  await expect(gal).toBeVisible();
  await expect(gal.locator('.os-gal__card')).toHaveCount(6);
  const first = gal.locator('.os-gal__card').first();
  const box = await first.boundingBox();
  const vw = page.viewportSize()!.width;
  expect(box!.width).toBeGreaterThan(vw * 0.7); // pleine largeur → 1 colonne
});
