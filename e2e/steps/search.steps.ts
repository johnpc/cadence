import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect, type Page } from '@playwright/test';
import { navigate } from './app-shell.steps';

const { When, Then } = createBdd();

/** Wait for the search to SETTLE to a definite state — either the results
 * container renders, or the empty state does. Under CI's shared-Jellyfin
 * contention the native search fan-out (Items + Artists + Playlists) can
 * transiently error, which lands the page in LoadState's error+retry panel
 * instead; when that happens, tap Retry (a real user's move) and, failing that,
 * re-type the query to re-issue it — then re-check. This re-firing is exactly
 * what searchUntilResults does for artist/genre; the plain results steps lacked
 * it, which is why a single transient fetch error timed out the whole scenario. */
async function settleSearch(page: Page, term: string): Promise<void> {
  const input = page.getByTestId('search-input').locator('input');
  const settled = page.getByTestId('search-results').or(page.getByTestId('load-empty'));
  await expect(async () => {
    if (!(await settled.count())) {
      // Not settled yet: recover from a transient error, then re-issue the query.
      const retry = page.getByTestId('load-error').getByRole('button', { name: 'Try again' });
      if (await retry.count())
        await retry
          .first()
          .click()
          .catch(() => undefined);
      await input.fill('');
      await input.fill(term);
    }
    await expect(settled.first()).toBeVisible({ timeout: 8_000 });
  }).toPass({ timeout: DATA_WAIT });
}

When('I open the Search tab', async ({ page }) => {
  await navigate(page, 'Search');
  await expect(page.getByTestId('search-input')).toBeVisible();
});

When('I search for {string}', async ({ page }, term: string) => {
  // IonSearchbar wraps a native input. Settle to a definite results/empty state
  // (re-firing on a transient error) so the following assertions never race a
  // still-loading or transiently-errored search.
  await page.getByTestId('search-input').locator('input').fill(term);
  await settleSearch(page, term);
});

When('I press Enter in the search box', async ({ page }) => {
  // Enter activates the Top result (Spotify-style) — a song plays.
  await page.getByTestId('search-input').locator('input').press('Enter');
});

Then('I see song results', async ({ page }) => {
  const results = page.getByTestId('search-results');
  await expect(results.getByText('Songs')).toBeVisible({ timeout: DATA_WAIT });
  await expect(results.getByTestId('track-row').first()).toBeVisible({ timeout: DATA_WAIT });
});

When('I tap the first song result', async ({ page }) => {
  await page.getByTestId('search-results').getByTestId('track-row-play').first().click();
});

When('I filter results to {string}', async ({ page }, label: string) => {
  // The filter chips only mount once search RESULTS render (the search screen
  // shows the idle/empty state otherwise). A transient fetch error under
  // contention replaces the chips with the error panel — recover via Try again,
  // then click the chip once it's present. Re-fire until the chip is hittable.
  const chip = page.getByTestId(`filter-${label.toLowerCase()}`);
  await expect(async () => {
    const retry = page.getByTestId('load-error').getByRole('button', { name: 'Try again' });
    if (await retry.count())
      await retry
        .first()
        .click()
        .catch(() => undefined);
    await expect(chip).toBeVisible({ timeout: 8_000 });
  }).toPass({ timeout: DATA_WAIT });
  await chip.click();
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
  // A transient fetch error under contention shows the error panel, not the empty
  // state — tap Try again until the empty state resolves (the query genuinely has
  // no matches, so a successful fetch always lands here).
  const empty = page.getByTestId('load-empty');
  await expect(async () => {
    const retry = page.getByTestId('load-error').getByRole('button', { name: 'Try again' });
    if (await retry.count())
      await retry
        .first()
        .click()
        .catch(() => undefined);
    await expect(empty).toBeVisible({ timeout: 8_000 });
  }).toPass({ timeout: DATA_WAIT });
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
  // The genre grid is fetched async — wait for the tile to exist/attach BEFORE
  // scrolling to it (scrollIntoViewIfNeeded on a not-yet-attached element throws
  // "Element is not attached to the DOM", which flaked deterministically).
  await expect(tile).toBeVisible({ timeout: DATA_WAIT });
  await tile.scrollIntoViewIfNeeded();
  await tile.click({ force: true });
});

Then("I see the genre's tracks", async ({ page }) => {
  const rows = page.getByTestId('genre-detail').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
});

When('I play the genre', async ({ page }) => {
  await page.getByTestId('genre-detail').getByTestId('play-all').click({ force: true });
});
