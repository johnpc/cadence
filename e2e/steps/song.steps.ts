import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I open the song page from the full player', async ({ page }) => {
  // The full-player title links to the current track's own page.
  const link = page.getByTestId('full-player-song-link');
  await expect(link).toBeVisible({ timeout: 15_000 });
  await link.click({ force: true });
});

Then("I see the song's detail page with a link to its artist", async ({ page }) => {
  await expect(page.getByTestId('song-detail')).toBeAttached({ timeout: 30_000 });
  // The linked artist(s)·album line resolves with at least one link.
  await expect(page.getByTestId('song-links').getByRole('link').first()).toBeAttached({
    timeout: 30_000,
  });
});
