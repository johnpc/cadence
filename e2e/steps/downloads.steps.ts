import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { DATA_WAIT } from './timeouts';
import { navigate } from './app-shell.steps';
import { login, createSmallPlaylist, deletePlaylistsByName, type Session } from './jellyfinApi';

const { Given, When, Then, After } = createBdd();

const USER = process.env.TEST_USERNAME as string;
const PASS = process.env.TEST_PASSWORD as string;
// A tiny fixture playlist (deterministic name) so "download the whole playlist"
// finishes fast and fully — the real library's first playlist can have 400+
// tracks, which no time budget can download.
const FIXTURE = 'E2E Offline Fixture';
let owner: Session | null = null;

Given('I own a small playlist for offline download', async () => {
  owner = await login(USER, PASS);
  await deletePlaylistsByName(owner, FIXTURE); // sweep any crashed-run leftover
  await createSmallPlaylist(owner, FIXTURE, 2);
});

After(async () => {
  try {
    const s = owner ?? (await login(USER, PASS));
    await deletePlaylistsByName(s, FIXTURE);
  } catch {
    /* best-effort teardown */
  }
});

When('I open my offline-fixture playlist', async ({ page }) => {
  await navigate(page, 'Your Library');
  const row = page.getByTestId('library-row').filter({ hasText: FIXTURE }).first();
  await expect(row).toBeVisible({ timeout: DATA_WAIT });
  await row.click();
  await expect(page.getByTestId('playlist-detail')).toBeVisible({ timeout: DATA_WAIT });
});

/** Open the first search-result row's "…" menu. */
async function openFirstResultMenu(page: import('@playwright/test').Page) {
  const firstRow = page.getByTestId('search-results').getByTestId('track-row').first();
  await expect(firstRow).toBeVisible({ timeout: DATA_WAIT });
  await firstRow.getByTestId('add-to-playlist').click();
}

When('I download the first song result', async ({ page }) => {
  // Download now lives in the row's "…" menu. Tap Download, then reopen the menu
  // and wait until it flips to "Remove download" — i.e. the audio bytes landed.
  await openFirstResultMenu(page);
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  await expect(async () => {
    await openFirstResultMenu(page);
    await expect(page.getByRole('button', { name: 'Remove download' })).toBeVisible({
      timeout: 2000,
    });
    await page.keyboard.press('Escape');
  }).toPass({ timeout: DATA_WAIT });
});

Then('the first song result shows as downloaded', async ({ page }) => {
  await openFirstResultMenu(page);
  await expect(page.getByRole('button', { name: 'Remove download' })).toBeVisible({
    timeout: DATA_WAIT,
  });
  await page.keyboard.press('Escape');
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
  // In the Downloads screen, remove via the first row's "…" menu → Remove
  // download.
  const firstRow = page.getByTestId('downloads').getByTestId('track-row').first();
  await expect(firstRow).toBeVisible({ timeout: DATA_WAIT });
  await firstRow.getByTestId('add-to-playlist').click();
  await page.getByRole('button', { name: 'Remove download' }).click();
});

Then('Downloads is empty', async ({ page }) => {
  // Removing the last download flips the screen to its empty state.
  await expect(page.getByTestId('load-empty')).toBeVisible({ timeout: DATA_WAIT });
});
