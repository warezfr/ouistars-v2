import { test, expect, type Page } from '@playwright/test';
import { installStubs } from './support/stubs';

/**
 * Régression visuelle des blocs clés — la parade aux régressions CSS déjà
 * vécues (sections disparues, styles tronqués). La vidéo hero et les rails
 * animés sont masqués/gelés pour un rendu stable.
 */
async function prep(page: Page) {
  await installStubs(page);
  await page.emulateMedia({ reducedMotion: 'reduce' }); // gèle rails & dunes
  await page.goto('/');
  await page.addStyleTag({
    content: `
      video { visibility: hidden !important; }
      *, *::before, *::after { animation: none !important; transition: none !important; }
    `,
  });
  await page.evaluate(async () => {
    await (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready;
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 25));
    }
    window.scrollTo(0, 0);
  });
}

const BLOCKS: Array<{ name: string; selector: string }> = [
  { name: 'services', selector: '#dmc' },
  { name: 'meet-greeter', selector: '#meet-greet' },
  { name: 'itineraires', selector: '#tours' },
  { name: 'corporate', selector: '#corporate' },
  { name: 'footer', selector: '.os-footer' },
];

for (const block of BLOCKS) {
  test(`visuel : bloc ${block.name}`, async ({ page }) => {
    await prep(page);
    const el = page.locator(block.selector).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(el).toHaveScreenshot(`${block.name}.png`, { maxDiffPixelRatio: 0.02 });
  });
}
