import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I open the first playlist', async ({ page }) => {
  const row = page.getByTestId('playlists').getByTestId('playlist-row').first();
  await expect(row).toBeAttached({ timeout: 15_000 });
  await row.click({ force: true });
});

Then('I see the playlist tracks', async ({ page }) => {
  // A large playlist's items read from the shared Jellyfin server can take
  // several seconds (more under CI contention) — give it real headroom.
  const rows = page.getByTestId('playlist-detail').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: 30_000 });
  expect(await rows.count()).toBeGreaterThan(0);
});

When('I play the playlist', async ({ page }) => {
  await page.getByTestId('playlist-detail').getByTestId('play-all').click({ force: true });
});
