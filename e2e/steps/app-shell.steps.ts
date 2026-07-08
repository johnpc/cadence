import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

const USERNAME = process.env.TEST_USERNAME;
const PASSWORD = process.env.TEST_PASSWORD;

Given('I open the app', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

Given('I am signed in', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('signin-username').fill(USERNAME as string);
  await page.getByTestId('signin-password').fill(PASSWORD as string);
  await page.getByTestId('signin-submit').click();
  await page.waitForFunction(() =>
    Object.keys(localStorage).some((k) => k.includes('cadence.session')),
  );
});

Then('I see the sign-in screen', async ({ page }) => {
  await expect(page.getByTestId('signin-submit')).toBeVisible();
});

Then('I see the {string} tab', async ({ page }, label: string) => {
  await expect(page.locator('ion-tab-button', { hasText: label })).toBeVisible();
});

When('I tap the {string} tab', async ({ page }, label: string) => {
  await page.locator('ion-tab-button', { hasText: label }).click();
});

Then('I see the search placeholder', async ({ page }) => {
  await expect(page.getByTestId('search-input')).toBeVisible();
  await expect(page.getByTestId('search-idle')).toBeVisible();
});
