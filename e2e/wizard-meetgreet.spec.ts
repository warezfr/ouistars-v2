import { test, expect } from '@playwright/test';
import { installStubs, captureIntake } from './support/stubs';

test('wizard Meet & Greeter : parcours complet avec retour arrière', async ({ page }) => {
  await installStubs(page);
  const captured = await captureIntake(page);
  await page.goto('/');

  // Ouverture depuis le bloc Meet & Greeter.
  await page.locator('#meet-greet').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Réservez maintenant' }).click();

  const wiz = page.locator('.os-mgw__panel');
  await expect(wiz).toBeVisible();
  await expect(wiz.getByRole('heading', { name: 'Choisissez votre type de service' })).toBeVisible();

  // Étape 1 → Arrivée.
  await wiz.locator('.os-mgw__card', { hasText: 'Arrivée' }).click();
  await expect(wiz.getByRole('heading', { name: 'Choisissez votre aéroport' })).toBeVisible();

  // Retour arrière : le choix précédent est conservé (carte sélectionnée).
  await wiz.getByRole('button', { name: /Retour/ }).click();
  await expect(wiz.locator('.os-mgw__card.is-sel', { hasText: 'Arrivée' })).toBeVisible();
  await wiz.locator('.os-mgw__card', { hasText: 'Arrivée' }).click();

  // Étape 2 → aéroport parisien avec tarif officiel 280 €.
  const parisAirport = wiz.locator('.os-mgw__airport', { hasText: 'CDG' }).first();
  await expect(parisAirport).toContainText('280 €');
  await parisAirport.click();

  // Étape 3 : récapitulatif avec le prix, formulaire.
  await expect(wiz.getByRole('heading', { name: 'Finalisez votre demande' })).toBeVisible();
  await expect(wiz.locator('.os-mgw__chip--price')).toContainText('280 €');

  const field = (label: string) => wiz.locator('.os-mgw__labeled', { hasText: label }).locator('input').first();
  await field('Prénom').fill('Jean');
  await field('Nom').fill('E2E');
  await field('Téléphone').fill('+33600000000');

  // Date obligatoire — calendrier custom : ouvrir le popover, mois suivant, jour 15.
  await wiz.locator('.osp-field').first().click();
  const cal = wiz.locator('.osp-pop--cal');
  await expect(cal).toBeVisible();
  await cal.getByRole('button', { name: /Mois suivant|Next month/ }).click();
  // Les jours portent un aria-label complet (« 15 août 2026 ») → cible par texte.
  await cal.locator('.osp-cell:not(.is-disabled)', { hasText: /^15$/ }).first().click();

  // E-mail requis pour l'envoi par e-mail.
  await field('E-mail').fill('jean@e2e.fr');
  await wiz.getByRole('button', { name: 'Envoyer par e-mail' }).click();

  await expect(wiz.getByRole('heading', { name: /Demande envoyée/ })).toBeVisible({ timeout: 5000 });
  const body = captured.bodies.at(-1)!;
  expect(body.type).toBe('greeter');
  expect((body.data as Record<string, unknown>).service_type).toBe('arrival');
});
