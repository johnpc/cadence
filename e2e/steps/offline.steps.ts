import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { DATA_WAIT } from './timeouts';

const { When, Then } = createBdd();

When('I turn on Offline mode in Settings', async ({ page }) => {
  await page.goto('/settings');
  const toggle = page.getByTestId('force-offline-toggle');
  await expect(toggle).toBeVisible({ timeout: DATA_WAIT });
  await toggle.click();
  // Assert the DURABLE signal — the preference persists to localStorage — rather
  // than IonToggle's shadow-DOM checked state, which is awkward to read reliably.
  await expect(async () => {
    const on = await page.evaluate(() => localStorage.getItem('cadence.forceOffline'));
    expect(on).toBe('on');
  }).toPass({ timeout: DATA_WAIT });
});

When('I open the offline library', async ({ page }) => {
  // Reachable from the offline banner's link and directly by route; go direct so
  // the test doesn't depend on where the banner happens to be rendered.
  await page.goto('/offline');
  await expect(page.getByTestId('offline-library')).toBeVisible({ timeout: DATA_WAIT });
});

Then('the offline library shows my downloaded content', async ({ page }) => {
  // The segment bar only renders categories with content, so its presence proves
  // the library was built from real downloaded items — with no server (offline).
  await expect(page.getByTestId('offline-segment')).toBeVisible({ timeout: DATA_WAIT });
});

When('I open the Songs section of the offline library', async ({ page }) => {
  const seg = page.getByTestId('offline-seg-songs');
  await expect(seg).toBeVisible({ timeout: DATA_WAIT });
  await seg.click();
});

Then('I see a downloaded song there', async ({ page }) => {
  const rows = page.getByTestId('offline-songs').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
  expect(await rows.count()).toBeGreaterThan(0);
});
