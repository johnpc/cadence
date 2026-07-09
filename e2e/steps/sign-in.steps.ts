import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

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
  await expect(page.getByTestId('home-shelves')).toBeVisible({ timeout: 30_000 });
});

Then('I see a sign-in error', async ({ page }) => {
  // The rejecting Jellyfin round-trip can be slow under CI contention (and the
  // server may throttle repeated bad-password attempts) — give it real headroom.
  await expect(page.getByTestId('signin-error')).toBeVisible({ timeout: 60_000 });
});
