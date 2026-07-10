import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { navigate } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the Search tab', async ({ page }) => {
  await navigate(page, 'Search');
  await expect(page.getByTestId('search-input')).toBeVisible();
});

When('I search for {string}', async ({ page }, term: string) => {
  // IonSearchbar wraps a native input.
  await page.getByTestId('search-input').locator('input').fill(term);
});

When('I press Enter in the search box', async ({ page }) => {
  // Enter activates the Top result (Spotify-style) — a song plays.
  await page.getByTestId('search-input').locator('input').press('Enter');
});

Then('I see song results', async ({ page }) => {
  const results = page.getByTestId('search-results');
  await expect(results.getByText('Songs')).toBeVisible();
  await expect(results.getByTestId('track-row').first()).toBeVisible();
});

When('I tap the first song result', async ({ page }) => {
  await page.getByTestId('search-results').getByTestId('track-row-play').first().click();
});

When('I filter results to {string}', async ({ page }, label: string) => {
  await page.getByTestId(`filter-${label.toLowerCase()}`).click();
});

Then('I do not see the Albums section', async ({ page }) => {
  await expect(page.getByTestId('search-results').getByText('Albums')).toHaveCount(0);
});

// The Songs section is the only place track-row appears in search results
// (albums/artists/playlists render result-row), so counting track-rows in the
// results = the songs shown.
Then('the songs section shows at most 4 results', async ({ page }) => {
  const rows = page.getByTestId('search-results').getByTestId('track-row');
  await expect(rows.first()).toBeVisible({ timeout: DATA_WAIT });
  expect(await rows.count()).toBeLessThanOrEqual(4);
});

Then('the songs section shows more than 4 results', async ({ page }) => {
  const rows = page.getByTestId('search-results').getByTestId('track-row');
  await expect(async () => {
    expect(await rows.count()).toBeGreaterThan(4);
  }).toPass({ timeout: DATA_WAIT });
});

Then('I see playlist results', async ({ page }) => {
  const rows = page.getByTestId('search-playlists').getByTestId('result-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
});

When('I open the first playlist result', async ({ page }) => {
  await page
    .getByTestId('search-playlists')
    .getByTestId('result-row')
    .first()
    .click({ force: true });
});

Then('I see the no-results state', async ({ page }) => {
  await expect(page.getByTestId('load-empty')).toBeVisible();
});

When('I clear the search box', async ({ page }) => {
  await page.getByTestId('search-input').locator('input').fill('');
});

Then('I see it in recent searches', async ({ page }) => {
  const recents = page.getByTestId('recent-searches');
  await expect(recents).toBeVisible({ timeout: DATA_WAIT });
  await expect(recents.getByTestId('result-row').first()).toBeAttached();
});

When('I open the {string} genre tile', async ({ page }, name: string) => {
  // The genre grid lives on the Search idle screen (no query typed). Click the
  // tile BUTTON itself (filtering by its label), not the inner text node — a
  // force-click on the span doesn't reliably fire the button's navigation.
  const tile = page.getByTestId('genre-tile').filter({ hasText: name }).first();
  await tile.scrollIntoViewIfNeeded();
  await expect(tile).toBeVisible({ timeout: DATA_WAIT });
  await tile.click({ force: true });
});

Then("I see the genre's tracks", async ({ page }) => {
  const rows = page.getByTestId('genre-detail').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
});

When('I play the genre', async ({ page }) => {
  await page.getByTestId('genre-detail').getByTestId('play-all').click({ force: true });
});
