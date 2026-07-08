import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { navigate } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the Search tab', async ({ page }) => {
  await navigate(page, 'Search');
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

When('I filter results to {string}', async ({ page }, label: string) => {
  await page.getByTestId(`filter-${label.toLowerCase()}`).click();
});

Then('I do not see the Albums section', async ({ page }) => {
  await expect(page.getByTestId('search-results').getByText('Albums')).toHaveCount(0);
});

Then('I see playlist results', async ({ page }) => {
  const rows = page.getByTestId('search-playlists').getByTestId('result-row');
  await expect(rows.first()).toBeAttached({ timeout: 15_000 });
});

When('I open the first playlist result', async ({ page }) => {
  await page
    .getByTestId('search-playlists')
    .getByTestId('result-row')
    .first()
    .click({ force: true });
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
