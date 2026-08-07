import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { navigate } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the Audiobooks tab', async ({ page }) => {
  // Navigate IN-APP via the "Books" nav entry (desktop sidebar / mobile tab) — no
  // page reload, so the session is never re-resolved and can't bounce to sign-in
  // (unlike a page.goto reload, which was the old flake source). navigate() clicks
  // and verifies the route settled, re-issuing on Ionic's dropped-click race.
  await navigate(page, 'Audiobooks');
  await expect(page).toHaveURL(/\/audiobooks$/, { timeout: DATA_WAIT });
  // Wait for the page's own container to mount before the scenario reads data — a
  // cold-miss→native fallback first scan can be slow over the tunnel.
  await expect(page.getByTestId('audiobooks').first()).toBeVisible({ timeout: DATA_WAIT });
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

When("I open the first book's detail page", async ({ page }) => {
  // Tap the first real book row's open button (the art button plays instead) and
  // wait for the detail route + its own container so the scenario reads real data.
  await page
    .getByTestId('audiobooks')
    .getByTestId('book-row')
    .first()
    .getByTestId('book-row-open')
    .click();
  await expect(page).toHaveURL(/\/audiobook\//, { timeout: DATA_WAIT });
  await expect(page.getByTestId('book-detail')).toBeVisible({ timeout: DATA_WAIT });
});

Then("I see the book's title and a details block", async ({ page }) => {
  // Real rendered data: a non-empty title, and the facts block (which always
  // carries at least the Parts fact) with at least one labelled fact.
  const title = page.getByTestId('book-title');
  await expect(title).toBeVisible({ timeout: DATA_WAIT });
  expect((await title.innerText()).trim().length).toBeGreaterThan(0);
  await expect(page.getByTestId('book-facts')).toBeVisible({ timeout: DATA_WAIT });
  expect(await page.getByTestId('book-fact').count()).toBeGreaterThan(0);
});

Then("I see the book's chapter or part list", async ({ page }) => {
  // A book lists EITHER its parts (multi-file) OR embedded chapters (single m4b
  // with markers). Assert at least one such row is shown for the opened book.
  const parts = page.getByTestId('book-part');
  const chapters = page.getByTestId('book-chapter');
  await expect
    .poll(async () => (await parts.count()) + (await chapters.count()), { timeout: DATA_WAIT })
    .toBeGreaterThan(0);
});
