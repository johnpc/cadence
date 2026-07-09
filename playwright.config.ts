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
  // In CI, run scenarios within an area SERIALLY (workers: 1). Every scenario
  // signs in and reads/writes the SAME self-hosted Jellyfin; with 4 workers ×
  // 3 parallel area jobs that was ~12 concurrent sign-in storms hammering one
  // server — the root of the acceptance "flakes". Serial per area + the
  // max-parallel:3 cap keeps peak load gentle. Locally, 4 workers for speed.
  workers: process.env.CI ? 1 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // CI reaches the home Jellyfin through a cloudflared tunnel, so round-trips
  // can be slow — give tests and assertions extra headroom there.
  timeout: process.env.CI ? 120_000 : 60_000,
  expect: { timeout: process.env.CI ? 30_000 : 15_000 },
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
