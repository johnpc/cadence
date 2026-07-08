import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I open the Library tab', async ({ page }) => {
  await page.locator('ion-tab-button', { hasText: 'Your Library' }).click();
});

When('I like the first track on Home', async ({ page }) => {
  await expect(page.getByTestId('home-tracks')).toBeVisible();
  // Ensure the first Home track ends up LIKED (idempotent — clicking an already
  // liked track would unlike it, so only click when it isn't pressed yet).
  const heart = page.getByTestId('home-tracks').getByTestId('like-button').first();
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
