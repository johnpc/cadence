import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I open the Search tab', async ({ page }) => {
  await page.locator('ion-tab-button', { hasText: 'Search' }).click();
  await expect(page.getByTestId('search-input')).toBeVisible();
});

When('I search for {string}', async ({ page }, term: string) => {
  // IonSearchbar wraps a native input.
  await page.getByTestId('search-input').locator('input').fill(term);
});

Then('I see song results', async ({ page }) => {
  const results = page.getByTestId('search-results');
  await expect(results.getByText('Songs')).toBeVisible();
  await expect(results.getByTestId('track-row').first()).toBeVisible();
});

When('I tap the first song result', async ({ page }) => {
  await page.getByTestId('search-results').getByTestId('track-row-play').first().click();
});

Then('I see the no-results state', async ({ page }) => {
  await expect(page.getByTestId('load-empty')).toBeVisible();
});

When('I clear the search box', async ({ page }) => {
  await page.getByTestId('search-input').locator('input').fill('');
});

Then('I see it in recent searches', async ({ page }) => {
  const recents = page.getByTestId('recent-searches');
  await expect(recents).toBeVisible({ timeout: 15_000 });
  await expect(recents.getByTestId('result-row').first()).toBeAttached();
});
