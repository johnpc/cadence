import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I open the first album on Home', async ({ page }) => {
  const card = page.getByTestId('home-shelves').getByTestId('album-card').first();
  await expect(card).toBeAttached({ timeout: 15_000 });
  await card.click({ force: true });
});

Then('I see the album tracks', async ({ page }) => {
  const rows = page.getByTestId('album-detail').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: 30_000 });
  expect(await rows.count()).toBeGreaterThan(0);
});

When('I play the album', async ({ page }) => {
  await page.getByTestId('album-play-all').click({ force: true });
});
