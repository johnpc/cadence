import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I tap the first track on Home', async ({ page }) => {
  // Home loads real library tracks; wait for the list, then play the first.
  await expect(page.getByTestId('home-tracks')).toBeVisible();
  await page.getByTestId('track-row-play').first().click();
});

Then('the Now-Playing bar shows a track', async ({ page }) => {
  await expect(page.getByTestId('now-playing-bar')).toBeVisible();
  await expect(page.getByTestId('now-playing-title')).not.toBeEmpty();
});

Then('the audio element is loaded with a Jellyfin stream', async ({ page }) => {
  // The one long-lived <audio> gets a Jellyfin universal-stream src on play.
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio');
    return !!audio?.src && audio.src.includes('/Audio/') && audio.src.includes('/universal');
  });
});

When('I open the full player', async ({ page }) => {
  await page.getByTestId('now-playing-open').click();
  await expect(page.getByTestId('full-player')).toBeVisible();
  // Let the modal's enter animation finish so its backdrop stops intercepting.
  await page.waitForTimeout(600);
});

When('I tap next', async ({ page }) => {
  // force: the modal's subtle idle transitions can leave Playwright's stability
  // check unsatisfied even though the control is visible + enabled.
  await page.getByTestId('full-player-next').click({ force: true });
});
