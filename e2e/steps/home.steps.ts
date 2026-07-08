import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { navigate } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the Home tab', async ({ page }) => {
  await navigate(page, 'Home');
  await expect(page.getByTestId('home-shelves')).toBeAttached({ timeout: 15_000 });
});

Then('I see a {string} mix', async ({ page }, label: string) => {
  // The "Made for you" shelf appears once the user follows ≥1 artist. Its
  // heading and at least one mix card resolve — never a hung spinner.
  await expect(page.getByText(label)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('daily-mix').first()).toBeAttached({ timeout: 15_000 });
});

When('I play the first mix', async ({ page }) => {
  // A real (non-force) click on the always-visible card body: force-clicking
  // lands on the hover FAB overlaying the card without firing its handler.
  const mix = page.getByTestId('daily-mix-hit').first();
  await mix.scrollIntoViewIfNeeded();
  await mix.click();
});

When('I open the full play history', async ({ page }) => {
  // The "Recently played" shelf appears once a track has been played; its
  // "Show all" link opens the full history page.
  const seeAll = page.getByTestId('shelf-see-all').first();
  await expect(seeAll).toBeVisible({ timeout: 15_000 });
  await seeAll.click();
});

Then('I see the play history list', async ({ page }) => {
  const rows = page.getByTestId('history').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: 30_000 });
});

Then('I see the Recently added shelf with albums', async ({ page }) => {
  await expect(page.getByTestId('home-greeting')).toBeVisible();
  await expect(page.getByText('Recently added')).toBeVisible();
  const cards = page.getByTestId('home-shelves').getByTestId('album-card');
  await expect(cards.first()).toBeAttached({ timeout: 15_000 });
  expect(await cards.count()).toBeGreaterThan(0);
});
