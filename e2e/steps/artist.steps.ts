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
