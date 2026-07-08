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
  await page.getByTestId('album-detail').getByTestId('play-all').click({ force: true });
});

When('I save the album', async ({ page }) => {
  const save = page.getByTestId('album-detail').getByTestId('save-button');
  await expect(save).toBeAttached({ timeout: 30_000 });
  // Idempotent: only toggle on if not already saved (re-runs shouldn't unsave).
  if ((await save.getAttribute('aria-pressed')) !== 'true') {
    await save.click({ force: true });
    await expect(save).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  }
});

Then('the saved albums list is not empty', async ({ page }) => {
  const rows = page.getByTestId('library-list').getByTestId('library-row');
  await expect(rows.first()).toBeAttached({ timeout: 30_000 });
});
