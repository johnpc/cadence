import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Then } = createBdd();

Then('I see the Recently added shelf with albums', async ({ page }) => {
  await expect(page.getByTestId('home-greeting')).toBeVisible();
  await expect(page.getByText('Recently added')).toBeVisible();
  const cards = page.getByTestId('home-shelves').getByTestId('album-card');
  await expect(cards.first()).toBeAttached({ timeout: 15_000 });
  expect(await cards.count()).toBeGreaterThan(0);
});
