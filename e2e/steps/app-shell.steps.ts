import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect, type Page } from '@playwright/test';

const { Given, When, Then, Before } = createBdd();

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

/** Type a search term and wait for a result inside `sectionTestId` to attach,
 * re-firing the query if the first attempt yields nothing in time. Mirrors a
 * real user re-typing when a search is slow, and exercises the query-retry
 * path — so a single transient Jellyfin hiccup doesn't fail the run. The result
 * is the first `resultTestId` (default track-row-play) within the section. */
export async function searchUntilResults(
  page: Page,
  term: string,
  sectionTestId: string,
  resultTestId = 'track-row-play',
): Promise<void> {
  const input = page.getByTestId('search-input').locator('input');
  const result = page.getByTestId(sectionTestId).getByTestId(resultTestId).first();
  for (let attempt = 0; attempt < 3; attempt++) {
    await input.fill('');
    await input.fill(term);
    try {
      await expect(result).toBeAttached({ timeout: 20_000 });
      return;
    } catch {
      if (attempt === 2)
        throw new Error(`No "${resultTestId}" in "${sectionTestId}" after 3 tries`);
    }
  }
}

// A fixed DeviceId per e2e run. ensureDeviceId reads it from the
// Capacitor-Preferences localStorage key, so every scenario/retry in a run reuses
// ONE Jellyfin session instead of minting a fresh device each time — which
// otherwise piles up thousands of sessions and slows Jellyfin auth to a crawl.
// CRUCIAL for parallel CI: Jellyfin keys a playback session per (user, DeviceId),
// and every acceptance area signs in as the SAME cadence-test user. A single
// shared DeviceId across concurrent matrix shards made them collide on ONE
// server-side session and clobber each other's state (areas passed alone, failed
// together — the real root cause of the "stampede flake"). So CI sets a distinct
// E2E_DEVICE_ID per area (see ci.yml); the default is only for local single runs.
const E2E_DEVICE_ID = process.env.E2E_DEVICE_ID || 'cadence-e2e-fixed-device';
const DEVICE_KEY = 'CapacitorStorage.cadence.device-id';

// Seed the fixed DeviceId via an init script — it runs BEFORE any app code on
// every navigation, so the app's ensureDeviceId() finds it already present and
// never mints a random one. (Seeding after goto() raced the app's own async
// Preferences.set of a fresh UUID, which clobbered the seed — so every scenario
// still authenticated as a new device and the sessions kept piling up.)
Before(async ({ page }) => {
  await page.addInitScript(
    ([key, id]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, id);
    },
    [DEVICE_KEY, E2E_DEVICE_ID],
  );
});

Given('I open the app', async ({ page }) => {
  await page.goto('/');
});

Given('I am signed in', async ({ page }) => {
  await page.goto('/');
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
  // The session key is written a beat BEFORE the router replaces /signin with
  // the destination — so waiting on the key alone lets the next step race the
  // route transition (and a cold data fetch) with too small a budget, which
  // flaked intermittently. Wait for the sign-in form to actually go away so
  // downstream assertions start from the signed-in app, not mid-navigation.
  await expect(page.getByTestId('signin-submit')).toHaveCount(0, { timeout: DATA_WAIT });
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

When('I collapse the sidebar', async ({ page }) => {
  await page.getByTestId('sidebar-collapse').click();
});

Then('the sidebar is collapsed', async ({ page }) => {
  await expect(page.getByTestId('sidebar-collapse')).toHaveAttribute('aria-expanded', 'false');
});

Then('the sidebar is expanded', async ({ page }) => {
  await expect(page.getByTestId('sidebar-collapse')).toHaveAttribute('aria-expanded', 'true');
});

When('I press the search hotkey', async ({ page }) => {
  // Wait for the shell (which mounts the "/" listener) to be ready, then focus
  // neutral chrome so "/" isn't typed into a field, and press it.
  await expect(page.getByTestId('home-shelves')).toBeAttached({ timeout: DATA_WAIT });
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await expect(async () => {
    await page.keyboard.press('/');
    await expect(page).toHaveURL(/\/search$/, { timeout: 2_000 });
  }).toPass({ timeout: DATA_WAIT });
});

Then('the search box is focused', async ({ page }) => {
  // "/" navigates to Search and focuses its input (Spotify-style). Assert the
  // route landed first, then that the searchbar's inner input holds focus.
  await expect(page).toHaveURL(/\/search$/, { timeout: DATA_WAIT });
  await expect(page.getByTestId('search-input').locator('input')).toBeFocused({
    timeout: DATA_WAIT,
  });
});

When('I press the shortcuts-help hotkey', async ({ page }) => {
  // Wait for the shell (which mounts the "?" listener) to be ready, then focus
  // neutral chrome so "?" isn't typed into a field, and press it.
  await expect(page.getByTestId('home-shelves')).toBeAttached({ timeout: DATA_WAIT });
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await expect(async () => {
    await page.keyboard.press('?');
    await expect(page.getByTestId('shortcuts-help')).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: DATA_WAIT });
});

Then('I see the keyboard shortcuts overlay', async ({ page }) => {
  await expect(page.getByTestId('shortcuts-help')).toBeVisible({ timeout: DATA_WAIT });
  // The overlay lists real shortcut rows (Space = play/pause among them).
  await expect(page.getByTestId('shortcut-row').first()).toBeVisible();
  await expect(page.getByText('Play / pause')).toBeVisible();
});

When('the device goes offline', async ({ page }) => {
  // Ensure the shell (which mounts the offline banner) is up before toggling,
  // so the state change lands on a mounted listener rather than mid-transition.
  await expect(page.getByTestId('home-shelves')).toBeAttached({ timeout: DATA_WAIT });
  await page.context().setOffline(true);
});

Then('I see the offline banner', async ({ page }) => {
  await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: DATA_WAIT });
});

When('the device comes back online', async ({ page }) => {
  await page.context().setOffline(false);
});

Then('the offline banner is gone', async ({ page }) => {
  await expect(page.getByTestId('offline-banner')).toHaveCount(0, { timeout: DATA_WAIT });
});

When('I navigate to an unknown URL', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');
});

Then('I see the not-found page', async ({ page }) => {
  await expect(page.getByTestId('not-found')).toBeVisible({ timeout: DATA_WAIT });
  await expect(page.getByText('404')).toBeVisible();
});

When('I tap {string} on the not-found page', async ({ page }, _label: string) => {
  await page.getByTestId('not-found-home').click();
});
