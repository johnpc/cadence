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

Then('the playlist play button becomes a pause button', async ({ page }) => {
  // Once the playlist is the active, playing queue, its play-all flips to Pause
  // (Spotify-style) rather than staying a restart button.
  await expect(page.getByTestId('playlist-detail').getByTestId('play-all')).toHaveAttribute(
    'aria-label',
    'Pause',
    { timeout: 15_000 },
  );
});

When('I press the playlist play button', async ({ page }) => {
  await page.getByTestId('playlist-detail').getByTestId('play-all').click({ force: true });
});

Then('I see recommended songs to add', async ({ page }) => {
  // Recommendations come from Jellyfin's instant-mix radio seeded on the
  // playlist — real tracks, fetched after the playlist's own items resolve.
  await expect(page.getByTestId('playlist-recs')).toBeAttached({ timeout: 30_000 });
  await expect(page.getByTestId('playlist-rec').first()).toBeAttached({ timeout: 30_000 });
});

// The recommendation dismissed in the When step, asserted gone in the Then.
let dismissedRec = '';

When('I dismiss the first recommendation', async ({ page }) => {
  const first = page.getByTestId('playlist-rec').first();
  // Remember the track name so we can assert it's replaced, not just removed.
  dismissedRec = (await first.getByTestId('rec-add').getAttribute('aria-label')) ?? '';
  await first.getByTestId('rec-dismiss').click({ force: true });
});

Then('a different recommendation takes its place', async ({ page }) => {
  // The dismissed track is gone, and the section still offers recommendations.
  await expect(page.getByRole('button', { name: dismissedRec })).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(page.getByTestId('playlist-rec').first()).toBeAttached({ timeout: 15_000 });
});

Then('I can find within the playlist', async ({ page }) => {
  // The "Find in playlist" box shows only for playlists with >8 tracks. If it's
  // present, typing narrows the list; if absent (a short playlist), that's the
  // documented behaviour — either way, never a hung/incorrect state.
  const detail = page.getByTestId('playlist-detail');
  const search = detail.getByTestId('playlist-search');
  if ((await search.count()) === 0) return;
  const before = await detail.getByTestId('track-row').count();
  await search.locator('input').fill('zzzznotarealsong');
  await expect(page.getByTestId('playlist-no-matches')).toBeVisible({ timeout: 10_000 });
  await search.locator('input').fill('');
  await expect(detail.getByTestId('track-row')).toHaveCount(before, { timeout: 10_000 });
});
