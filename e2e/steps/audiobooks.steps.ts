import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { ensureSignedIn } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the Audiobooks tab', async ({ page }) => {
  // The Audiobooks destination is the "Books" tab button (mobile tab bar) and
  // isn't in the desktop sidebar, so navigate by route — robust across viewports.
  // A goto is a full reload; the optimistic session validate can transiently 401
  // under tunnel load and bounce to sign-in, so re-authenticate in place if so
  // (no-op when the session survived). Then confirm the URL + the page's own
  // container mounted before the scenario reads data (a cold-miss→native first
  // scan can be slow over the tunnel).
  // The reload's optimistic session validate can transiently 401 under tunnel
  // load and sign the app out (a known auth-resilience gap), landing back on
  // sign-in — sometimes AFTER the first paint. So drive the whole thing in a
  // retry: land on /audiobooks, re-auth if we bounced, and require the page's own
  // container to be mounted. A transient sign-out just re-runs the body.
  await expect(async () => {
    await page.goto('/audiobooks');
    await ensureSignedIn(page);
    await expect(page).toHaveURL(/\/audiobooks$/, { timeout: 5_000 });
    await expect(page.getByTestId('audiobooks').first()).toBeVisible({ timeout: 15_000 });
  }).toPass({ timeout: 120_000 });
});

Then('I see the audiobook library with books', async ({ page }) => {
  // Assert on RENDERED real Jellyfin data — the container plus at least one real
  // book row (not just the tab being visible). Works on either source: the plugin
  // fast path or the native scan produce the same book-row shape.
  await expect(page.getByTestId('audiobooks').first()).toBeVisible({ timeout: DATA_WAIT });
  const rows = page.getByTestId('audiobooks').getByTestId('book-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
  expect(await rows.count()).toBeGreaterThan(0);
});

When('I search the audiobooks for a book that exists', async ({ page }) => {
  // Take a word from the first book's title so the query is guaranteed to match
  // real library data (not a hardcoded guess).
  const firstRow = page.getByTestId('audiobooks').getByTestId('book-row').first();
  const title = (await firstRow.innerText()).trim();
  const term = title.split(/\s+/)[0] ?? title;
  const search = page.getByTestId('audiobook-search').locator('input');
  await search.fill(term);
});

Then('I see at least one matching book', async ({ page }) => {
  // No "no matches" notice, and at least one row still shown after filtering.
  await expect(page.getByTestId('audiobook-no-matches')).toHaveCount(0, { timeout: DATA_WAIT });
  const rows = page.getByTestId('audiobooks').getByTestId('book-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
});
