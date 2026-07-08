import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I open the Library tab', async ({ page }) => {
  await page.locator('ion-tab-button', { hasText: 'Your Library' }).click();
});

When('I like a track from search', async ({ page }) => {
  // Home is now shelves; like a track from Search (which lists tracks). Ensure
  // it ends LIKED (idempotent — clicking an already-liked heart unlikes it).
  await page.locator('ion-tab-button', { hasText: 'Search' }).click();
  await page.getByTestId('search-input').locator('input').fill('love');
  const heart = page.getByTestId('search-results').getByTestId('like-button').first();
  await expect(heart).toBeVisible({ timeout: 15_000 });
  if ((await heart.getAttribute('aria-pressed')) !== 'true') {
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'true');
  }
});

Then('I see the liked songs list', async ({ page }) => {
  // Either the liked-songs list or a titled empty state resolves — never a hung
  // spinner. Attachment (not viewport visibility) dodges Ionic's tab quirk.
  await expect(page.getByTestId('liked-songs').or(page.getByTestId('load-empty'))).toBeAttached({
    timeout: 15_000,
  });
});

Then('the liked songs list is not empty', async ({ page }) => {
  // Assert on real rendered rows. Ionic keeps inactive tab pages attached but
  // flags them "not visible" to Playwright, so assert attachment + count.
  const rows = page.getByTestId('liked-songs').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: 15_000 });
  expect(await rows.count()).toBeGreaterThan(0);
});
