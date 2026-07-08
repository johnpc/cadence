import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I open the first playlist', async ({ page }) => {
  const row = page.getByTestId('playlists').getByTestId('playlist-row').first();
  await expect(row).toBeAttached({ timeout: 15_000 });
  await row.click({ force: true });
});

Then('I see the playlist tracks', async ({ page }) => {
  const rows = page.getByTestId('playlist-detail').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: 15_000 });
  expect(await rows.count()).toBeGreaterThan(0);
});

When('I play the playlist', async ({ page }) => {
  await page.getByTestId('playlist-play-all').click({ force: true });
});
