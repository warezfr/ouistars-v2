import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installStubs } from './support/stubs';

/** Audit axe-core — zéro violation « serious » ou « critical ». */
const GRAVES = ['serious', 'critical'];

function graves(results: { violations: Array<{ impact?: string | null; id: string; nodes: unknown[] }> }) {
  return results.violations.filter((v) => GRAVES.includes(v.impact ?? ''));
}

test.beforeEach(async ({ page }) => {
  await installStubs(page);
  await page.goto('/');
});

test('accessibilité : page d’accueil', async ({ page }) => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 25));
    }
    window.scrollTo(0, 0);
  });
  const results = await new AxeBuilder({ page })
    .disableRules(['video-caption']) // vidéo décorative aria-hidden
    .analyze();
  expect(graves(results).map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
});

test('accessibilité : galerie « Tout afficher » ouverte', async ({ page }) => {
  await page.locator('#tours').scrollIntoViewIfNeeded();
  await page.locator('#tours').getByRole('button', { name: /Tout afficher/ }).click();
  await expect(page.locator('.os-gal')).toBeVisible();
  const results = await new AxeBuilder({ page }).include('.os-gal').analyze();
  expect(graves(results).map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
});

test('accessibilité : wizard Meet & Greeter ouvert', async ({ page }) => {
  await page.locator('#meet-greet').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Réservez maintenant' }).click();
  await expect(page.locator('.os-mgw__panel')).toBeVisible();
  const results = await new AxeBuilder({ page }).include('.os-mgw__panel').analyze();
  expect(graves(results).map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
});
