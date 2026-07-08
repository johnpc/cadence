import { createBdd } from 'playwright-bdd';
import { expect, type Page } from '@playwright/test';

const { Given, When, Then } = createBdd();

const USERNAME = process.env.TEST_USERNAME;
const PASSWORD = process.env.TEST_PASSWORD;

/** Primary-nav label → sidebar testid (desktop). */
export const NAV_TESTID: Record<string, string> = {
  Home: 'nav-home',
  Search: 'nav-search',
  'Your Library': 'nav-library',
};

/** Click a primary-nav destination, working in both layouts: the desktop
 * sidebar link or the mobile tab button — whichever is actually visible (both
 * are in the DOM; the inactive layout is display:none). */
/** The active library list: the desktop sidebar's copy when visible, else the
 * mobile /library page's. Both carry data-testid="library-list", so scope to
 * the surface that's actually on screen. */
export function libraryList(page: Page) {
  const sidebar = page.getByTestId('desktop-sidebar');
  return sidebar.getByTestId('library-list');
}

export async function navigate(page: Page, label: string): Promise<void> {
  // Prefer the desktop sidebar link (CI width). It may mount a beat after the
  // shell, so give it a moment before falling back to the mobile tab button.
  const sidebar = page.getByTestId(NAV_TESTID[label]);
  try {
    await sidebar.waitFor({ state: 'visible', timeout: 5_000 });
    await sidebar.click();
  } catch {
    await page.locator('ion-tab-button', { hasText: label }).click();
  }
}

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
  // The Jellyfin auth POST can be slow under CI contention — give the session
  // token a generous window to land before proceeding.
  await page.waitForFunction(
    () => Object.keys(localStorage).some((k) => k.includes('cadence.session')),
    undefined,
    { timeout: 60_000 },
  );
});

Then('I see the sign-in screen', async ({ page }) => {
  await expect(page.getByTestId('signin-submit')).toBeVisible();
});

Then('I see the {string} tab', async ({ page }, label: string) => {
  // Desktop (CI width) shows the sidebar nav; mobile shows the tab bar. The
  // sidebar link is always in the DOM at desktop width.
  await expect(page.getByTestId(NAV_TESTID[label])).toBeVisible();
});

When('I tap the {string} tab', async ({ page }, label: string) => {
  await navigate(page, label);
});

Then('I see the search placeholder', async ({ page }) => {
  await expect(page.getByTestId('search-input')).toBeVisible();
  await expect(page.getByTestId('search-idle')).toBeVisible();
});
