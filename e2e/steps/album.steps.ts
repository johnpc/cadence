import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { libraryList } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the first album on Home', async ({ page }) => {
  // The card body (its __hit button) navigates; the hover FAB plays. Click the
  // body to open the album detail page.
  const card = page.getByTestId('home-shelves').getByTestId('album-card').first();
  await expect(card).toBeAttached({ timeout: DATA_WAIT });
  await card.locator('.album-card__hit').click({ force: true });
});

Then('I see the album tracks', async ({ page }) => {
  const rows = page.getByTestId('album-detail').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
  expect(await rows.count()).toBeGreaterThan(0);
});

When('I play the album', async ({ page }) => {
  await page.getByTestId('album-detail').getByTestId('play-all').click({ force: true });
});

Then('I see albums that fans also like', async ({ page }) => {
  // "Fans also like" is derived from the album's instant-mix radio. Most albums
  // yield sibling albums, but a sparse mix can legitimately produce none (the
  // section then renders nothing) — accept either the populated section or the
  // tracklist that always precedes it, never a hung spinner.
  const similar = page.getByTestId('similar-album').first();
  const tracks = page.getByTestId('album-detail').getByTestId('track-row').first();
  await expect(similar.or(tracks)).toBeAttached({ timeout: DATA_WAIT });
});

When('I save the album', async ({ page }) => {
  const save = page.getByTestId('album-detail').getByTestId('save-button');
  await expect(save).toBeAttached({ timeout: DATA_WAIT });
  // Idempotent: only toggle on if not already saved (re-runs shouldn't unsave).
  if ((await save.getAttribute('aria-pressed')) !== 'true') {
    await save.click({ force: true });
    await expect(save).toHaveAttribute('aria-pressed', 'true', { timeout: DATA_WAIT });
  }
});

Then('the saved albums list is not empty', async ({ page }) => {
  const rows = libraryList(page).getByTestId('library-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
});

When('I open the {string} album result', async ({ page }, name: string) => {
  const albums = page.getByTestId('search-albums');
  await expect(albums).toBeVisible({ timeout: DATA_WAIT });
  await albums.getByTestId('result-row').filter({ hasText: name }).first().click({ force: true });
});

Then(
  'I see disc headers {string} and {string}',
  async ({ page }, first: string, second: string) => {
    // A genuine multi-disc album (e.g. "Rent") renders Spotify-style disc headers
    // over its tracks; the tracklist is one continuous queue underneath.
    const headings = page.getByTestId('album-detail').getByTestId('album-disc-heading');
    await expect(headings.filter({ hasText: first })).toBeVisible({ timeout: DATA_WAIT });
    await expect(headings.filter({ hasText: second })).toBeVisible({ timeout: DATA_WAIT });
  },
);
