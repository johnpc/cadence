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

/** Open the first search-result row's "…" menu. CRUCIAL: dismiss any action
 * sheet still open from a previous step/iteration FIRST — Ionic's open
 * <ion-action-sheet> renders a full-screen <ion-backdrop> that intercepts pointer
 * events, so clicking the menu button under it silently retries to a timeout
 * (the real downloads failure). Also scroll into view: the now-playing bar can
 * overlap the lower rows. */
// The row's "…" opens an <ion-action-sheet is-open>. Ionic does NOT remove
// dismissed sheets — it leaves them in the DOM as .overlay-hidden — so match ONLY
// the currently-open one, or a plain `ion-action-sheet` locator strict-mode-
// violates once several have accumulated, and `waitFor detached` never resolves.
const OPEN_SHEET = 'ion-action-sheet[is-open]';

async function dismissOpenSheet(page: import('@playwright/test').Page) {
  // Dismiss by tapping the open sheet's backdrop — NOT Escape: the search field
  // is an IonSearchbar, which CLEARS its value on Escape, which would wipe the
  // results the very next openFirstResultMenu depends on. Backdrop-tap closes the
  // sheet without touching the searchbar. No-op when no sheet is open.
  const backdrop = page.locator(`${OPEN_SHEET} ion-backdrop`);
  if (await backdrop.count()) {
    await backdrop
      .first()
      .click({ force: true })
      .catch(() => undefined);
    await page
      .locator(OPEN_SHEET)
      .waitFor({ state: 'detached', timeout: 5_000 })
      .catch(() => undefined);
  }
}

async function openFirstResultMenu(page: import('@playwright/test').Page) {
  // Dismiss any sheet still open from a prior step/iteration first — an open
  // sheet's <ion-backdrop> intercepts the menu-button click (the real downloads
  // failure). Also scroll into view: the now-playing bar can overlap lower rows.
  await dismissOpenSheet(page);
  const firstRow = page.getByTestId('search-results').getByTestId('track-row').first();
  await expect(firstRow).toBeVisible({ timeout: DATA_WAIT });
  const menu = firstRow.getByTestId('add-to-playlist');
  await menu.scrollIntoViewIfNeeded();
  await menu.click();
  // Buttons are actionable only once the sheet is open.
  await expect(page.locator(OPEN_SHEET)).toBeVisible({ timeout: DATA_WAIT });
}

When('I download the first song result', async ({ page }) => {
  // Download lives in the row's "…" menu. Tap Download, then poll by REOPENING
  // the menu until it flips to "Remove download" — i.e. the audio bytes landed.
  await openFirstResultMenu(page);
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  await expect(async () => {
    await openFirstResultMenu(page);
    await expect(page.getByRole('button', { name: 'Remove download' })).toBeVisible({
      timeout: 2000,
    });
    await dismissOpenSheet(page);
  }).toPass({ timeout: DATA_WAIT });
});

Then('the first song result shows as downloaded', async ({ page }) => {
  await openFirstResultMenu(page);
  await expect(page.getByRole('button', { name: 'Remove download' })).toBeVisible({
    timeout: DATA_WAIT,
  });
  await dismissOpenSheet(page);
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
