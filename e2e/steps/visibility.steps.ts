import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { DATA_WAIT } from './timeouts';
import {
  login,
  createPlaylist,
  setPlaylistPublic,
  deletePlaylist,
  type Session,
} from './jellyfinApi';

const { Given, When, Then, Before, After } = createBdd();

const USER1 = process.env.TEST_USERNAME as string;
const PASS1 = process.env.TEST_PASSWORD as string;
const USER2 = process.env.TEST_USERNAME_2 as string;
const PASS2 = process.env.TEST_PASSWORD_2 as string;

/** Per-scenario state: user two's session + the playlist they created. A fixed
 * name (no Date/random — deterministic) that no other scenario or real playlist
 * uses, so the community-shelf assertions are unambiguous. */
const NAME = 'E2E Shared Visibility Mix';
let user2: Session | null = null;
let playlistId: string | null = null;

Before({ tags: '' }, () => {
  user2 = null;
  playlistId = null;
});

After(async () => {
  // Teardown: remove the fixture so runs stay clean, even if the scenario failed.
  if (user2 && playlistId) {
    try {
      await deletePlaylist(user2, playlistId);
    } catch {
      /* best-effort */
    }
  }
});

Given('user two owns a fresh public playlist', async () => {
  user2 = await login(USER2, PASS2);
  // Start from a clean slate: any leftover fixture from a crashed prior run.
  playlistId = await createPlaylist(user2, NAME, true);
});

When('I am signed in as user one', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('signin-username').fill(USER1);
  await page.getByTestId('signin-password').fill(PASS1);
  await page.getByTestId('signin-submit').click();
  await page.waitForFunction(
    () => Object.keys(localStorage).some((k) => k.includes('cadence.session')),
    undefined,
    { timeout: 60_000 },
  );
});

Then('I see the shared playlist in the community shelf', async ({ page }) => {
  // Home mounts ~7 shelves in parallel; the community one appears only once its
  // query resolves. Wait for the shelf to exist FIRST, then assert the card —
  // otherwise we race the shelf into existence. The card is in a horizontal
  // carousel, so assert attachment (past-the-fold cards aren't "visible"); scope
  // to the community shelf so it can't match a Search/Library copy of the name.
  const shelf = page.getByTestId('shelf').filter({ hasText: 'From the community' });
  await expect(shelf).toBeAttached({ timeout: 60_000 });
  await expect(shelf.getByText(NAME)).toBeAttached({ timeout: DATA_WAIT });
});

When('user two makes the playlist private', async () => {
  await setPlaylistPublic(user2 as Session, playlistId as string, false);
});

When('I refresh the community shelf', async ({ page }) => {
  // The shelf query is cached; a reload re-fetches getPublicPlaylists so the
  // now-private playlist drops out (mirrors what the user sees next launch).
  // Wait for Home to be fully back BEFORE the assertion so it can't race the
  // cold post-reload data fetch (the home-shelves container waits on the first
  // shelf query, which after a hard reload can take the full data budget).
  await page.reload();
  await expect(page.getByTestId('home-shelves')).toBeVisible({ timeout: 60_000 });
});

Then('I do not see the shared playlist in the community shelf', async ({ page }) => {
  // The now-private playlist must be gone from the community shelf (a private
  // playlist isn't visible to other users at all).
  const shelf = page.getByTestId('shelf').filter({ hasText: 'From the community' });
  await expect(shelf.getByText(NAME)).toHaveCount(0, { timeout: DATA_WAIT });
});
