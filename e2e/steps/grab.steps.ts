import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { DATA_WAIT, DOWNLOAD_WAIT } from './timeouts';

const { When, Then } = createBdd();

// The grab affordance under an empty search — shown only when Music Grabber is
// configured (URL + key in Settings/env). (@requires-deploy only.)
Then('I see the option to grab the track', async ({ page }) => {
  await expect(page.getByTestId('search-grab-cta')).toBeVisible({ timeout: DATA_WAIT });
});

When('I choose to grab the track', async ({ page }) => {
  const cta = page.getByTestId('search-grab-cta');
  await expect(cta).toBeVisible({ timeout: DATA_WAIT });
  await cta.click();
});

Then('I see grabbable results', async ({ page }) => {
  // Music Grabber search can be slow (multi-source) — allow the download budget.
  await expect(page.getByTestId('grab-result').first()).toBeVisible({ timeout: DOWNLOAD_WAIT });
});

When('I grab the first result', async ({ page }) => {
  await page.getByTestId('grab-button').first().click();
});

Then('I am told the track is being grabbed', async ({ page }) => {
  // The grab hook toasts "Grabbing …" immediately on tap.
  await expect(page.getByText(/Grabbing/i)).toBeVisible({ timeout: DATA_WAIT });
});
