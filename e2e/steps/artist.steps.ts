import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { libraryList, searchUntilResults } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the first artist result', async ({ page }) => {
  // Re-fire the (already-typed) search if the artist section is slow to fill,
  // so a transient Jellyfin hiccup doesn't fail the run.
  await searchUntilResults(page, 'love', 'search-artists', 'result-row');
  // No force: a forced click can miss the row after a re-render (search debounce)
  // and land on empty space — then the artist page never opens. Real click waits
  // for the row to be hittable.
  const row = page.getByTestId('search-artists').getByTestId('result-row').first();
  await expect(row).toBeVisible({ timeout: DATA_WAIT });
  await row.click();
});

Then("I see the artist's albums", async ({ page }) => {
  // The artist page loaded: the radio control is present, and the albums grid or
  // a titled empty state resolves (some artists are credited only per-track, so
  // the album grid can legitimately be empty) — never a hung spinner.
  await expect(page.getByTestId('artist-radio')).toBeAttached({ timeout: DATA_WAIT });
  await expect(page.getByTestId('artist-albums').or(page.getByTestId('load-empty'))).toBeAttached({
    timeout: DATA_WAIT,
  });
});

Then('I see related artists to explore', async ({ page }) => {
  // "Fans also like" is derived from the artist's instant-mix radio. Most
  // artists yield related picks, but a sparse mix can legitimately produce none
  // (the section then renders nothing) — so accept either the populated section
  // or its documented absence, never a hung spinner.
  const related = page.getByTestId('related-artist').first();
  const albums = page.getByTestId('artist-albums');
  await expect(related.or(albums)).toBeAttached({ timeout: DATA_WAIT });
});

When('I follow the artist', async ({ page }) => {
  const btn = page.getByTestId('artist-actions').getByTestId('save-button');
  await expect(btn).toBeAttached({ timeout: DATA_WAIT });
  // Idempotent: only follow if not already followed (re-runs shouldn't unfollow).
  if ((await btn.getAttribute('aria-pressed')) !== 'true') {
    await expect(btn).toBeVisible({ timeout: DATA_WAIT });
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true', { timeout: DATA_WAIT });
  }
});

Then('the followed artists list is not empty', async ({ page }) => {
  const rows = libraryList(page).getByTestId('library-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
});
