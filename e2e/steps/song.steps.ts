import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I open the song page from the full player', async ({ page }) => {
  // The full-player title links to the current track's own page. Click-and-VERIFY:
  // an Ionic route push can be dropped, leaving the test on the full player so the
  // song-detail assertion times out — re-issue until /song/ lands.
  const link = page.getByTestId('full-player-song-link');
  await expect(link).toBeVisible({ timeout: DATA_WAIT });
  await expect(async () => {
    await link.click({ force: true }).catch(() => undefined);
    await expect(page).toHaveURL(/\/song\//, { timeout: 3_000 });
  }).toPass({ timeout: DATA_WAIT });
});

Then("I see the song's detail page with a link to its artist", async ({ page }) => {
  await expect(page.getByTestId('song-detail')).toBeAttached({ timeout: DATA_WAIT });
  // The linked artist(s)·album line resolves with at least one link.
  await expect(page.getByTestId('song-links').getByRole('link').first()).toBeAttached({
    timeout: DATA_WAIT,
  });
});
