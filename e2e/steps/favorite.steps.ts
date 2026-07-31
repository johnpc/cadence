import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { DATA_WAIT } from './timeouts';
import { libraryList } from './app-shell.steps';

const { When, Then } = createBdd();

// The name of the playlist we favorited, captured so later steps can assert it
// bubbled to the top and reset it afterwards (kept in module scope — one
// scenario runs at a time on this serialized suite).
let favoritedName = '';

When('I favorite the playlist', async ({ page }) => {
  favoritedName = (await page.getByTestId('playlist-title').innerText()).trim();
  const heart = page.getByTestId('playlist-favorite');
  await expect(heart).toBeVisible({ timeout: DATA_WAIT });
  // Only toggle ON if it isn't already (a prior aborted run could leave it set).
  if ((await heart.getAttribute('aria-pressed')) !== 'true') {
    await heart.click();
  }
  await expect(heart).toHaveAttribute('aria-pressed', 'true', { timeout: DATA_WAIT });
});

Then('the playlist heart shows as on', async ({ page }) => {
  await expect(page.getByTestId('playlist-favorite')).toHaveAttribute('aria-pressed', 'true');
});

Then('the favorited playlist is the first real playlist', async ({ page }) => {
  // First row that isn't a pinned pseudo-playlist (Liked Songs / Downloads)
  // should be the one we just hearted.
  const rows = libraryList(page).getByTestId('library-row');
  await expect(rows.first()).toBeVisible({ timeout: DATA_WAIT });
  const firstReal = rows.filter({ hasNotText: 'Liked Songs' }).filter({ hasNotText: 'Downloads' });
  await expect(firstReal.first()).toContainText(favoritedName, { timeout: DATA_WAIT });
});

When('I unfavorite it again to reset', async ({ page }) => {
  // Re-open the favorited playlist and turn the heart off so the shared
  // cadence-test user's library returns to its prior state for the next run.
  const row = libraryList(page)
    .getByTestId('library-row')
    .filter({ hasText: favoritedName })
    .first();
  await expect(row).toBeVisible({ timeout: DATA_WAIT });
  await expect(async () => {
    await row.click({ force: true }).catch(() => undefined);
    await expect(page).toHaveURL(/\/playlist\//, { timeout: 3_000 });
  }).toPass({ timeout: DATA_WAIT });
  const heart = page.getByTestId('playlist-favorite');
  await expect(heart).toBeVisible({ timeout: DATA_WAIT });
  if ((await heart.getAttribute('aria-pressed')) === 'true') {
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'false', { timeout: DATA_WAIT });
  }
});
