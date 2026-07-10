import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { DATA_WAIT } from './timeouts';
import { navigate } from './app-shell.steps';

const { When, Then } = createBdd();

/** The download toggle on the first search-result track row. */
function firstResultDownload(page: import('@playwright/test').Page) {
  return page.getByTestId('search-results').getByTestId('download-button').first();
}

When('I download the first song result', async ({ page }) => {
  const btn = firstResultDownload(page);
  await expect(btn).toBeVisible({ timeout: DATA_WAIT });
  await btn.click();
  // The download fetches real audio bytes over the tunnel — wait for it to land
  // as 'downloaded' before any offline/navigation step depends on it.
  await expect(btn).toHaveAttribute('data-state', 'downloaded', { timeout: DATA_WAIT });
});

Then('the first song result shows as downloaded', async ({ page }) => {
  await expect(firstResultDownload(page)).toHaveAttribute('aria-pressed', 'true', {
    timeout: DATA_WAIT,
  });
});

When('I open Downloads from the library', async ({ page }) => {
  await navigate(page, 'Your Library');
  // The Downloads pseudo-playlist is pinned in the library list once something
  // is downloaded; open it.
  const row = page.getByTestId('library-row').filter({ hasText: 'Downloads' }).first();
  await expect(row).toBeVisible({ timeout: DATA_WAIT });
  await row.click();
  await expect(page.getByTestId('downloads')).toBeVisible({ timeout: DATA_WAIT });
});

Then('I see the downloaded track', async ({ page }) => {
  const rows = page.getByTestId('downloads').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
  expect(await rows.count()).toBeGreaterThan(0);
});

When('the network goes offline', async ({ page }) => {
  // Cut the network at the browser level: any Jellyfin stream request now fails,
  // so playback can ONLY succeed from the local download — the real test.
  await page.context().setOffline(true);
});

When('I play the first song result', async ({ page }) => {
  await page.getByTestId('search-results').getByTestId('track-row-play').first().click();
});

Then('the audio element is playing from a local download', async ({ page }) => {
  // A blob: src proves the audio is served from the cached download (an object
  // URL), not a network stream — the only thing that can play while offline.
  await page.waitForFunction(
    () => {
      const audio = document.querySelector('audio');
      return !!audio?.src && audio.src.startsWith('blob:');
    },
    undefined,
    { timeout: DATA_WAIT },
  );
});

When('I remove the first download', async ({ page }) => {
  // In the Downloads screen, each row's own download button (now 'downloaded')
  // removes it when tapped.
  const btn = page.getByTestId('downloads').getByTestId('download-button').first();
  await expect(btn).toBeVisible({ timeout: DATA_WAIT });
  await btn.click();
});

Then('Downloads is empty', async ({ page }) => {
  // Removing the last download flips the screen to its empty state.
  await expect(page.getByTestId('load-empty')).toBeVisible({ timeout: DATA_WAIT });
});
