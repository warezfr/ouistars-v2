import { defineConfig, devices } from '@playwright/test';

/**
 * E2E — servis par `vite preview` sur le build de production.
 * Tout le réseau externe (géocodage, OSRM, Supabase, /api/*) est intercepté
 * dans les specs → suite déterministe, zéro dépendance réseau.
 * Local sandbox : PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium si le browser
 * téléchargé par Playwright n'est pas disponible.
 */
const exec = process.env.PW_EXECUTABLE_PATH;

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4178',
    locale: 'fr-FR', // la détection de langue suit navigator.language — tests en FR
    trace: 'retain-on-failure',
    ...(exec ? { launchOptions: { executablePath: exec } } : {}),
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'], browserName: 'chromium' },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npx vite preview --port 4178 --strictPort',
    port: 4178,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
