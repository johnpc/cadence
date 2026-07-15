import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { DATA_WAIT, DOWNLOAD_WAIT } from './timeouts';

const { When, Then } = createBdd();

// A public Deezer playlist with a mix of tracks — some in the library, most not —
// so the result reliably shows both an added count and requestable missing
// artists. Deezer's public API needs no auth. (@requires-deploy only.)
const PUBLIC_DEEZER_PLAYLIST = 'https://www.deezer.com/playlist/908622995';

When('I open Import from Deezer', async ({ page }) => {
  // The entry point shows in the Library toolbar only when the plugin advertises
  // the import endpoint — click-and-verify the route lands (Ionic can drop it).
  const btn = page.getByTestId('library-import-deezer');
  await expect(btn).toBeVisible({ timeout: DATA_WAIT });
  await expect(async () => {
    await btn.click().catch(() => undefined);
    await expect(page).toHaveURL(/\/import\/deezer/, { timeout: 3_000 });
  }).toPass({ timeout: DATA_WAIT });
});

When('I paste a public Deezer playlist and import it', async ({ page }) => {
  await page.getByTestId('deezer-url').locator('input').fill(PUBLIC_DEEZER_PLAYLIST);
  await page.getByTestId('deezer-import').click();
  // The import pages the playlist + scans the whole library server-side — allow
  // the long byte/scan budget before the result renders.
  await expect(page.getByTestId('deezer-result')).toBeVisible({ timeout: DOWNLOAD_WAIT });
});

Then('I see how many tracks were added', async ({ page }) => {
  await expect(page.getByTestId('deezer-result')).toContainText(/of \d+ tracks/, {
    timeout: DATA_WAIT,
  });
});

Then('I see artists I can request', async ({ page }) => {
  await expect(page.getByTestId('deezer-missing-row').first()).toBeVisible({ timeout: DATA_WAIT });
});

Then('I see a link explaining how to move a Spotify playlist to Deezer', async ({ page }) => {
  const link = page.getByTestId('deezer-spotify-help');
  await expect(link).toBeVisible({ timeout: DATA_WAIT });
  await expect(link).toHaveAttribute('href', /spotify-to-deezer/);
});
