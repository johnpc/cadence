import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { navigate } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the Audiobooks tab', async ({ page }) => {
  await navigate(page, 'Audiobooks');
  await expect(page).toHaveURL(/\/audiobooks$/, { timeout: DATA_WAIT });
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
