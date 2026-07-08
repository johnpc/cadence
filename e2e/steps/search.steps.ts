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
  await page.getByTestId('search-results').getByTestId('track-row').first().click();
});

Then('I see the no-results state', async ({ page }) => {
  await expect(page.getByTestId('load-empty')).toBeVisible();
});
