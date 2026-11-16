import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { navigate } from './app-shell.steps';

const { Given, When, Then } = createBdd();

const USERNAME = process.env.TEST_USERNAME;
const PASSWORD = process.env.TEST_PASSWORD;

Given('I open the app signed out', async ({ page }) => {
  await page.goto('/');
  // Ensure a clean slate — no persisted session from a prior run.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('signin-submit')).toBeVisible();
});

Then('I see a server address field prefilled with a server', async ({ page }) => {
  const server = page.getByTestId('signin-server'); // testid sits on the <input>
  await expect(server).toBeVisible();
  // Prefilled with the build-time default so the maintainer's users sign in
  // without typing a URL; self-hosters can overwrite it.
  await expect(server).not.toHaveValue('');
});

When("I sign in with the test user's credentials", async ({ page }) => {
  await page.getByTestId('signin-username').fill(USERNAME as string);
  await page.getByTestId('signin-password').fill(PASSWORD as string);
  await page.getByTestId('signin-submit').click();
  // Wait for the persisted Jellyfin session before proceeding — navigating
  // before it lands races the session (the ghost-guest-read bug from stoop).
  // Generous timeout: the auth POST can be slow under CI contention.
  await page.waitForFunction(
    () => Object.keys(localStorage).some((k) => k.includes('cadence.session')),
    undefined,
    { timeout: 60_000 },
  );
});

When('I sign in by pressing Enter in the password field', async ({ page }) => {
  await page.getByTestId('signin-username').fill(USERNAME as string);
  const password = page.getByTestId('signin-password');
  await password.fill(PASSWORD as string);
  await password.press('Enter'); // native form submit — no button click
  await page.waitForFunction(
    () => Object.keys(localStorage).some((k) => k.includes('cadence.session')),
    undefined,
    { timeout: 60_000 },
  );
});

When('I sign in with a wrong password', async ({ page }) => {
  await page.getByTestId('signin-username').fill(USERNAME as string);
  await page.getByTestId('signin-password').fill('definitely-not-the-password');
  await page.getByTestId('signin-submit').click();
});

When('I reload the app', async ({ page }) => {
  await page.reload();
});

Then('I land on the Home tab', async ({ page }) => {
  // Home nav is the sidebar link (desktop) or tab button (mobile); either way
  // the Home shelves confirm we're signed in and on Home.
  await expect(page.getByTestId('home-shelves')).toBeVisible({ timeout: DATA_WAIT });
});

Then('I see a sign-in error', async ({ page }) => {
  // The rejecting Jellyfin round-trip can be slow under CI contention (and the
  // server may throttle repeated bad-password attempts) — give it real headroom.
  await expect(page.getByTestId('signin-error')).toBeVisible({ timeout: 60_000 });
});

When('I sign out from Settings', async ({ page }) => {
  // In-app navigation only: a page load would stop the audio by itself and
  // prove nothing about sign-out.
  await navigate(page, 'Your Library');
  await page.getByTestId('library-settings').first().click();
  await page.getByTestId('settings-signout').click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).last().click();
  await expect(page.getByTestId('signin-submit')).toBeVisible({ timeout: DATA_WAIT });
});

Then('nothing is playing', async ({ page }) => {
  // The previous user's track must not keep sounding on the sign-in screen
  // (or resume for whoever signs in next).
  await expect(async () => {
    const audio = await page.evaluate(() => {
      const el = document.querySelector('audio');
      return el ? { paused: el.paused, src: el.getAttribute('src') ?? '' } : null;
    });
    expect(audio?.paused ?? true).toBe(true);
    expect(audio?.src ?? '').toBe('');
  }).toPass({ timeout: DATA_WAIT });
});

// Simulates iOS launching the app before the phone is unlocked: reading the
// saved session throws (as the locked Keychain does), while everything else in
// storage still works. A sessionStorage flag survives the reload; the init
// script re-arms the throwing read on every page load while the flag is set.
Given("the device can't read the saved sign-in", async ({ page }) => {
  await page.addInitScript(() => {
    const read = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key: string) {
      if (sessionStorage.getItem('__e2e_session_locked') === '1' && key.includes('cadence.session'))
        throw new Error('e2e: saved sign-in is locked');
      return read.call(this, key);
    };
  });
  await page.evaluate(() => sessionStorage.setItem('__e2e_session_locked', '1'));
});

When('the device can read the saved sign-in again', async ({ page }) => {
  await page.evaluate(() => sessionStorage.removeItem('__e2e_session_locked'));
});

Then("I see that Cadence can't open my sign-in yet", async ({ page }) => {
  await expect(page.getByTestId('session-unavailable')).toBeVisible({ timeout: DATA_WAIT });
  // Not signed out: the sign-in form must not have replaced it.
  await expect(page.getByTestId('signin-submit')).toHaveCount(0);
});

When('I tap Try again', async ({ page }) => {
  await page.getByTestId('session-retry').click();
});
