import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * Load .env.local (gitignored) for local runs so TEST_USERNAME / TEST_PASSWORD
 * (the Jellyfin cadence-test user) are available without a dependency. In CI
 * these come from GitHub secrets.
 */
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

/**
 * Acceptance tests are Gherkin .feature files in e2e/features/ with step
 * definitions in e2e/steps/. playwright-bdd compiles them into Playwright
 * specs under .features-gen/ at run time.
 */
const E2E_PORT = Number(process.env.E2E_PORT) || 5173;

const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
  // Scenarios tagged @requires-deploy assert LIVE backend behavior (real
  // Jellyfin reads/writes) that only holds against the real server; excluded
  // from default runs. Include them with RUN_PENDING_DEPLOY=1.
  tags: process.env.RUN_PENDING_DEPLOY ? undefined : 'not @requires-deploy',
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  workers: 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'on-first-retry',
    video: process.env.VIDEO ? 'on' : 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // SLOWMO=<ms> launches a visible browser that pauses between actions so a
    // human can watch the Gherkin run, e.g. `SLOWMO=600 npm run test:e2e`.
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 0 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${E2E_PORT} --strictPort`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
