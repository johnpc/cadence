import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

Then('I see the Recently added shelf with albums', async ({ page }) => {
  await expect(page.getByText('Recently added')).toBeVisible();
  const cards = page.getByTestId('home-shelves').getByTestId('album-card');
  await expect(cards.first()).toBeAttached({ timeout: 15_000 });
  expect(await cards.count()).toBeGreaterThan(0);
});

When('I play the first album on Home', async ({ page }) => {
  await page.getByTestId('home-shelves').getByTestId('album-card').first().click({ force: true });
});
