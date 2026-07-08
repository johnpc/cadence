import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { libraryList } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the first playlist', async ({ page }) => {
  // Your Library lists Liked Songs first (pinned), then real playlists — open
  // the first row that isn't Liked Songs.
  const rows = libraryList(page).getByTestId('library-row');
  await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  const row = rows.filter({ hasNotText: 'Liked Songs' }).first();
  await expect(row).toBeVisible({ timeout: 15_000 });
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
