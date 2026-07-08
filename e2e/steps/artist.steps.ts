import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I open the first artist result', async ({ page }) => {
  const row = page.getByTestId('search-artists').getByTestId('result-row').first();
  await expect(row).toBeAttached({ timeout: 15_000 });
  await row.click({ force: true });
});

Then("I see the artist's albums", async ({ page }) => {
  // The artist page loaded: the radio control is present, and the albums grid or
  // a titled empty state resolves (some artists are credited only per-track, so
  // the album grid can legitimately be empty) — never a hung spinner.
  await expect(page.getByTestId('artist-radio')).toBeAttached({ timeout: 30_000 });
  await expect(page.getByTestId('artist-albums').or(page.getByTestId('load-empty'))).toBeAttached({
    timeout: 30_000,
  });
});

When('I follow the artist', async ({ page }) => {
  const btn = page.getByTestId('artist-actions').getByTestId('save-button');
  await expect(btn).toBeAttached({ timeout: 30_000 });
  // Idempotent: only follow if not already followed (re-runs shouldn't unfollow).
  if ((await btn.getAttribute('aria-pressed')) !== 'true') {
    await btn.click({ force: true });
    await expect(btn).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  }
});

Then('the followed artists list is not empty', async ({ page }) => {
  const rows = page.getByTestId('library-list').getByTestId('library-row');
  await expect(rows.first()).toBeAttached({ timeout: 30_000 });
});
