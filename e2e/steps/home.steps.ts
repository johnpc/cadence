import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { navigate } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open the Home tab', async ({ page }) => {
  await navigate(page, 'Home');
  await expect(page.getByTestId('home-shelves')).toBeAttached({ timeout: DATA_WAIT });
});

async function assertShelf(page: import('@playwright/test').Page, title: string) {
  // A shelf with the given title and at least one card. Scope to the shelves
  // container so the title match is unambiguous.
  const shelves = page.getByTestId('home-shelves');
  await expect(shelves.getByText(title, { exact: true })).toBeVisible({ timeout: DATA_WAIT });
  await expect(shelves.getByTestId('album-card').first()).toBeAttached({ timeout: DATA_WAIT });
}

Then('I see a {string} shelf', async ({ page }, title: string) => {
  await assertShelf(page, title);
});

Then('I see an {string} shelf', async ({ page }, title: string) => {
  await assertShelf(page, title);
});

Then('I see a {string} mix', async ({ page }, label: string) => {
  // The "Made for you" shelf appears from followed artists OR from the artists
  // in what you've played — so it surfaces even before any follow. Its heading
  // and at least one mix card resolve — never a hung spinner.
  await expect(page.getByText(label)).toBeVisible({ timeout: DATA_WAIT });
  await expect(page.getByTestId('daily-mix').first()).toBeAttached({ timeout: DATA_WAIT });
});

When('I play the first mix', async ({ page }) => {
  // The play FAB starts the mix radio (the card body now navigates to the
  // artist instead). Hover to reveal the FAB, then click it.
  const card = page.getByTestId('daily-mix').first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await card.getByTestId('daily-mix-play').click();
});

When('I play the first album on Home via its play button', async ({ page }) => {
  const card = page.getByTestId('home-shelves').getByTestId('album-card').first();
  await expect(card).toBeAttached({ timeout: DATA_WAIT });
  await card.scrollIntoViewIfNeeded();
  await card.hover(); // reveal the hover-only FAB
  await card.getByTestId('album-card-play').click();
});

Then('I am still on Home', async ({ page }) => {
  // Playing from a card must NOT navigate away — the Home shelves stay mounted.
  await expect(page.getByTestId('home-shelves')).toBeAttached();
  await expect(page).toHaveURL(/\/home$/);
});

When('I open the full play history', async ({ page }) => {
  // The "Recently played" shelf appears once a track has been played; its
  // "Show all" link opens the full history page.
  const seeAll = page.getByTestId('shelf-see-all').first();
  await expect(seeAll).toBeVisible({ timeout: DATA_WAIT });
  await seeAll.click();
});

Then('I see the play history list', async ({ page }) => {
  const rows = page.getByTestId('history').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
});

Then('I see the Recently added shelf with albums', async ({ page }) => {
  // Ionic keeps the outgoing page mounted (as .ion-page-hidden) through a route
  // transition, so a testid can briefly resolve to TWO nodes — the stale hidden
  // page and the live one. Assert on the FIRST match (the live page) to avoid a
  // strict-mode violation during that window.
  await expect(page.getByTestId('home-greeting').first()).toBeVisible();
  await expect(page.getByTestId('home-shelves').getByText('Recently added').first()).toBeVisible();
  const cards = page.getByTestId('home-shelves').getByTestId('album-card');
  await expect(cards.first()).toBeAttached({ timeout: DATA_WAIT });
  expect(await cards.count()).toBeGreaterThan(0);
});
