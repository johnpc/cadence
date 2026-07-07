import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('I open the app', async ({ page }) => {
  await page.goto('/');
});

Then('I see the {string} tab', async ({ page }, label: string) => {
  await expect(page.locator('ion-tab-button', { hasText: label })).toBeVisible();
});

When('I tap the {string} tab', async ({ page }, label: string) => {
  await page.locator('ion-tab-button', { hasText: label }).click();
});

Then('I see the search placeholder', async ({ page }) => {
  await expect(page.getByTestId('search-placeholder')).toBeVisible();
});
