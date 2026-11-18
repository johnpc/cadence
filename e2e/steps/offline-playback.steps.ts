import { createBdd } from 'playwright-bdd';
import { expect, type Page } from '@playwright/test';
import { DATA_WAIT, DOWNLOAD_WAIT } from './timeouts';
import {
  albumIdByName,
  likedTrackNames,
  login,
  logout,
  unlikeAlbumTracks,
  type Session,
} from './jellyfinApi';

const { Given, When, Then, After } = createBdd();

const USER = process.env.TEST_USERNAME as string;
const PASS = process.env.TEST_PASSWORD as string;
const JELLYFIN = new URL(process.env.VITE_JELLYFIN_URL as string).origin;
const OPEN_SHEET = 'ion-action-sheet[is-open]';

let api: Session | null = null;
let albumId = '';
const session = async () => (api ??= await login(USER, PASS));

After({ tags: '@offline-like' }, async () => {
  try {
    const s = await session();
    if (albumId) await unlikeAlbumTracks(s, albumId);
  } catch {
    /* best-effort teardown */
  }
});
After(async () => {
  if (!api) return;
  await logout(api.token);
  api = null;
});

/** Rows in the app's IndexedDB download index. */
const downloadedCount = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open('cadence');
        open.onerror = () => resolve(0);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains('downloads')) return resolve(0);
          const n = db.transaction('downloads', 'readonly').objectStore('downloads').count();
          n.onsuccess = () => resolve(n.result);
          n.onerror = () => resolve(0);
        };
      }),
  );

/** Messages of the toasts open right now. */
const openToasts = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('ion-toast')]
      .filter((t) => (t as unknown as { isOpen: boolean }).isOpen)
      .map((t) => (t as unknown as { message: string }).message),
  );

const albumRows = (page: Page) => page.getByTestId('album-detail').getByTestId('track-row');

async function openAlbum(page: Page, name: string) {
  albumId = await albumIdByName(await session(), name);
  await page.goto(`/album/${albumId}`);
  await expect(albumRows(page).first()).toBeVisible({ timeout: DATA_WAIT });
}

async function downloadRow(page: Page, index: number) {
  const before = await downloadedCount(page);
  await albumRows(page).nth(index).getByTestId('add-to-playlist').click();
  const sheet = page.locator(OPEN_SHEET);
  await expect(sheet).toBeVisible({ timeout: DATA_WAIT });
  await sheet.getByRole('button', { name: 'Download', exact: true }).click();
  await sheet.waitFor({ state: 'detached', timeout: 5_000 }).catch(() => undefined);
  await expect(async () => {
    expect(await downloadedCount(page)).toBeGreaterThan(before);
  }).toPass({ timeout: DOWNLOAD_WAIT });
}

Given(
  'I have downloaded the 1st and 3rd songs of the album {string}',
  async ({ page }, name: string) => {
    await openAlbum(page, name);
    await downloadRow(page, 0);
    await downloadRow(page, 2);
  },
);

// The SERVER is unreachable but the app shell still loads — exactly the native
// app in airplane mode (its shell is on the device). Every Jellyfin request
// fails like a dropped connection. Routing also turns off the HTTP cache, so a
// song prefetched earlier can't sneak through.
When('the server becomes unreachable', async ({ page }) => {
  await page.context().route(
    (url) => url.origin === JELLYFIN,
    (route) => route.abort('internetdisconnected'),
  );
});

When('I reopen the app', async ({ page }) => {
  await page.goto('/');
});

Then("I see that I'm offline", async ({ page }) => {
  await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: DATA_WAIT });
});

Then(`Home says it's offline instead of "Something went wrong"`, async ({ page }) => {
  await expect(page.getByTestId('home-shelves')).toBeVisible({ timeout: DATA_WAIT });
  await expect(page.locator('[data-testid="load-error"][data-offline]').first()).toBeVisible({
    timeout: DATA_WAIT,
  });
  await expect(page.getByText('Something went wrong.')).toHaveCount(0);
});

When('I browse my downloads from the offline message', async ({ page }) => {
  await page.getByTestId('load-error-downloads').first().click();
  await expect(page.getByTestId('offline-segment')).toBeVisible({ timeout: DATA_WAIT });
});

When('I play my first downloaded song', async ({ page }) => {
  await page.getByTestId('offline-seg-songs').click();
  const row = page.getByTestId('offline-songs').getByTestId('track-row').first();
  await expect(row).toBeVisible({ timeout: DATA_WAIT });
  await row.getByTestId('track-row-play').click();
});

When('I play the album {string} from the start', async ({ page }, name: string) => {
  await openAlbum(page, name);
  await page.getByTestId('play-all').first().click();
  await expect(page.getByTestId('now-playing-title')).toHaveText('Undertow', {
    timeout: DATA_WAIT,
  });
  await page.waitForFunction(() => !document.querySelector('audio')?.paused, undefined, {
    timeout: DATA_WAIT,
  });
});

When('I skip to the next song', async ({ page }) => {
  // The desktop layout's Next lives in the full player; the → shortcut is the
  // same command and needs no overlay.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
  await page.keyboard.press('ArrowRight');
});

When('I press play', async ({ page }) => {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
  await page.keyboard.press(' ');
});

Then("I'm told {string}", async ({ page }, message: string) => {
  await expect.poll(() => openToasts(page), { timeout: DATA_WAIT }).toContain(message);
});

Then('{string} plays from a local download', async ({ page }, title: string) => {
  await expect(page.getByTestId('now-playing-title')).toHaveText(title, { timeout: DATA_WAIT });
  await page.waitForFunction(
    () => {
      const a = document.querySelector('audio');
      return !!a && a.src.startsWith('blob:') && !a.paused && a.currentTime > 0;
    },
    undefined,
    { timeout: DOWNLOAD_WAIT },
  );
});

Then('playback stops', async ({ page }) => {
  await page.waitForFunction(() => !!document.querySelector('audio')?.paused, undefined, {
    timeout: DATA_WAIT,
  });
});

When('I type {string} into search', async ({ page }, term: string) => {
  await page.getByTestId('search-input').locator('input').fill(term);
});

Then('search says it is showing my downloads', async ({ page }) => {
  await expect(page.getByTestId('search-offline-note')).toBeVisible({ timeout: DATA_WAIT });
});

Then(
  'the search results are exactly my downloaded songs {string} and {string}',
  async ({ page }, a: string, b: string) => {
    const rows = page.getByTestId('search-results').getByTestId('track-row');
    await expect(rows).toHaveCount(2, { timeout: DATA_WAIT });
    await expect(rows.nth(0)).toContainText(a);
    await expect(rows.nth(1)).toContainText(b);
  },
);

When('I play the search result {string}', async ({ page }, title: string) => {
  const row = page
    .getByTestId('search-results')
    .getByTestId('track-row')
    .filter({ hasText: title });
  await row.first().getByTestId('track-row-play').click();
});

// A real device-level loss of network (navigator.onLine false): the like is
// held and sent when the connection returns, instead of failing.
When('the phone loses its connection', async ({ page }) => {
  await page.context().setOffline(true);
});

const fullPlayerLike = async (page: Page) => {
  if (
    !(await page
      .getByTestId('full-player')
      .isVisible()
      .catch(() => false))
  )
    await page.getByTestId('now-playing-open').click();
  const like = page.getByTestId('full-player').getByTestId('like-button').first();
  await expect(like).toBeVisible({ timeout: DATA_WAIT });
  return like;
};

When('I like the playing song from the full player', async ({ page }) => {
  const like = await fullPlayerLike(page);
  await like.click({ force: true });
  await expect(like).toHaveAttribute('aria-pressed', 'true');
});

Then('the playing song still shows as liked', async ({ page }) => {
  await expect(page.getByTestId('now-playing-title')).toHaveText('Undertow', {
    timeout: DATA_WAIT,
  });
  await expect(await fullPlayerLike(page)).toHaveAttribute('aria-pressed', 'true');
});

When('the server is reachable again', async ({ page }) => {
  await page.context().unrouteAll({ behavior: 'ignoreErrors' });
  // Any screen that talks to the server proves it's back; the pending like is
  // sent the moment Jellyfin answers.
  await page.goto('/home');
});

When("the phone's connection comes back", async ({ page }) => {
  await page.context().setOffline(false);
});

Then('the server has {string} in Liked Songs', async ({ $testInfo: _info }, title: string) => {
  const s = await session();
  await expect.poll(() => likedTrackNames(s, albumId), { timeout: DATA_WAIT }).toContain(title);
});
