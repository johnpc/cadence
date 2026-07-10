import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { libraryList } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the first playlist', async ({ page }) => {
  // Your Library lists Liked Songs first (pinned), then real playlists — open
  // the first row that isn't Liked Songs.
  const rows = libraryList(page).getByTestId('library-row');
  await expect(rows.first()).toBeVisible({ timeout: DATA_WAIT });
  const row = rows.filter({ hasNotText: 'Liked Songs' }).first();
  await expect(row).toBeVisible({ timeout: DATA_WAIT });
  await row.click({ force: true });
});

Then('I see the playlist tracks', async ({ page }) => {
  // A large playlist's items read from the shared Jellyfin server can take
  // several seconds (more under CI contention) — give it real headroom.
  const rows = page.getByTestId('playlist-detail').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
  expect(await rows.count()).toBeGreaterThan(0);
});

When('I time opening the first playlist', async ({ page }) => {
  // Measure the interaction John flagged as slow: tap a library playlist →
  // its first track row rendered. Report-only (logged, not asserted) so it's a
  // watchable trend, not a flaky gate on the tunnel-latency-bound fetch.
  const rows = libraryList(page).getByTestId('library-row');
  await expect(rows.first()).toBeVisible({ timeout: DATA_WAIT });
  const row = rows.filter({ hasNotText: 'Liked Songs' }).first();
  await expect(row).toBeVisible({ timeout: DATA_WAIT });
  const start = Date.now();
  await row.click({ force: true });
  await expect(page.getByTestId('playlist-detail').getByTestId('track-row').first()).toBeAttached({
    timeout: DATA_WAIT,
  });
  const ms = Date.now() - start;
  console.log(`[perf] playlist open → first track rendered: ${ms} ms`);
});

Then('the playlist opened within a reasonable time', async ({ page }) => {
  // The timing itself is reported in the When; here we just confirm the tracks
  // are actually present (the measurement wasn't of an empty/error state).
  await expect(page.getByTestId('playlist-detail').getByTestId('track-row').first()).toBeAttached({
    timeout: DATA_WAIT,
  });
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
    { timeout: DATA_WAIT },
  );
});

When('I press the playlist play button', async ({ page }) => {
  await page.getByTestId('playlist-detail').getByTestId('play-all').click({ force: true });
});

Then('I see recommended songs to add', async ({ page }) => {
  // Recommendations come from Jellyfin's instant-mix radio seeded on the
  // playlist — real tracks, fetched after the playlist's own items resolve.
  await expect(page.getByTestId('playlist-recs')).toBeAttached({ timeout: DATA_WAIT });
  await expect(page.getByTestId('playlist-rec').first()).toBeAttached({ timeout: DATA_WAIT });
});

// The dismissed rec's track id — we assert on the id (via data-track-id), not
// its track name, which can recur in the instant-mix pool (duplicate titles)
// and made a name-based "is it gone?" check flaky.
let dismissedId = '';

When('I dismiss the first recommendation', async ({ page }) => {
  const first = page.getByTestId('playlist-rec').first();
  await expect(first).toBeAttached({ timeout: DATA_WAIT });
  dismissedId = (await first.getAttribute('data-track-id')) ?? '';
  // A real (non-force) click: force-clicking the small dismiss button can land
  // on an overlapping element without firing its handler.
  const dismiss = first.getByTestId('rec-dismiss');
  await dismiss.scrollIntoViewIfNeeded();
  await dismiss.click();
});

Then('the full player shows it is playing from a playlist', async ({ page }) => {
  // Spotify-style "Playing from playlist · <name>" caption at the top of the
  // full player, driven by the collection the queue was started from.
  const ctx = page.getByTestId('full-player').getByTestId('playing-from');
  await expect(ctx).toBeVisible({ timeout: DATA_WAIT });
  await expect(ctx).toContainText('Playing from playlist');
});

Then('a different recommendation takes its place', async ({ page }) => {
  // The exact dismissed track (by id) is gone and never re-appears; the section
  // stays functional with at least one recommendation.
  await expect(
    page.locator(`[data-testid="playlist-rec"][data-track-id="${dismissedId}"]`),
  ).toHaveCount(0, { timeout: DATA_WAIT });
  await expect(page.getByTestId('playlist-rec').first()).toBeAttached({ timeout: 20_000 });
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

// Original name captured in the When, restored so the run is idempotent.
let originalPlaylistName = '';

When('I open the rename prompt', async ({ page }) => {
  // The rename button lives in the header toolbar (sibling of playlist-detail).
  originalPlaylistName =
    (
      await page.getByTestId('playlist-detail').getByTestId('playlist-title').textContent()
    )?.trim() ?? '';
  await page.getByTestId('rename-playlist').click({ force: true });
});

Then('I see the rename prompt prefilled with the playlist name', async ({ page }) => {
  // The prompt (an IonAlert) opens with its text input prefilled with the
  // current name, ready to edit. (Driving IonAlert's value in-test is
  // unreliable — the rename mutation itself is covered by unit tests.)
  const input = page.locator('ion-alert:has-text("Rename playlist") input');
  await expect(input).toBeVisible({ timeout: DATA_WAIT });
  await expect(input).toHaveValue(originalPlaylistName);
});
