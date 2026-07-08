import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I open the Library tab', async ({ page }) => {
  await page.locator('ion-tab-button', { hasText: 'Your Library' }).click();
  // Wait for the library list to render before the next step acts on it.
  await expect(page.getByTestId('library-list')).toBeAttached({ timeout: 15_000 });
});

When('I filter the library to {string}', async ({ page }, filter: string) => {
  await page.getByTestId(`library-filter-${filter}`).click({ force: true });
});

When('I open Liked Songs', async ({ page }) => {
  // Liked Songs is the pinned first row of the Playlists filter.
  const row = page.getByTestId('library-list').getByText('Liked Songs');
  await expect(row).toBeAttached({ timeout: 15_000 });
  await row.click({ force: true });
  // Wait for the Liked Songs page to render before the next step acts on it.
  await expect(page.getByTestId('liked-songs')).toBeAttached({ timeout: 15_000 });
});

When('I shuffle-play the liked songs', async ({ page }) => {
  // Wait for the tracks to actually load — shuffle-play with an empty list is a
  // no-op, so clicking before the query resolves silently fails to start audio.
  const rows = page.getByTestId('liked-songs').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: 15_000 });
  // Retry the click until playback actually starts — the Ionic route transition
  // can swallow a click aimed at the still-animating page.
  const shuffle = page.getByTestId('liked-songs').getByTestId('shuffle-all');
  await expect(async () => {
    await shuffle.click({ force: true });
    await expect(page.getByTestId('now-playing-bar')).toBeAttached({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
});

When('I like a track from search', async ({ page }) => {
  // Home is shelves; like a track from Search (which lists tracks). Ensure it
  // ends LIKED (idempotent — clicking an already-liked heart unlikes it).
  await page.locator('ion-tab-button', { hasText: 'Search' }).click();
  await page.getByTestId('search-input').locator('input').fill('love');
  const heart = page.getByTestId('search-results').getByTestId('like-button').first();
  await expect(heart).toBeVisible({ timeout: 15_000 });
  if ((await heart.getAttribute('aria-pressed')) !== 'true') {
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'true');
  }
});

Then('I see the Liked Songs row', async ({ page }) => {
  // Ionic keeps inactive tab pages attached but flags them "not visible", so
  // assert attachment.
  await expect(page.getByTestId('library-list').getByText('Liked Songs')).toBeAttached({
    timeout: 15_000,
  });
});

Then('the liked songs list is not empty', async ({ page }) => {
  const rows = page.getByTestId('liked-songs').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: 15_000 });
  expect(await rows.count()).toBeGreaterThan(0);
});
