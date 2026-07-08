import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { When, Then } = createBdd();

When('I tap a track from search', async ({ page }) => {
  // Home is now recommendation shelves (no flat track list), so drive playback
  // from Search, which lists individual tracks.
  await page.locator('ion-tab-button', { hasText: 'Search' }).click();
  await page.getByTestId('search-input').locator('input').fill('love');
  const rows = page.getByTestId('search-results').getByTestId('track-row-play');
  await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  await rows.first().click();
});

Then('the Now-Playing bar shows a track', async ({ page }) => {
  // Assert attachment, not viewport visibility: on nested routes (e.g. /liked)
  // Ionic keeps the tab-slot mini-player attached but flags it "not visible".
  await expect(page.getByTestId('now-playing-bar')).toBeAttached({ timeout: 15_000 });
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

When('I press the spacebar', async ({ page }) => {
  // Click empty page chrome first so focus isn't in the search input.
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Space');
});

Then('playback is paused', async ({ page }) => {
  // The mini-player toggle flips to the Play icon (aria-label) when paused.
  await expect(page.getByTestId('now-playing-toggle')).toHaveAttribute('aria-label', 'Play', {
    timeout: 15_000,
  });
});

When('I open lyrics', async ({ page }) => {
  const btn = page.getByTestId('full-player-lyrics');
  await btn.scrollIntoViewIfNeeded();
  await btn.click({ force: true });
});

Then('the lyrics sheet is shown', async ({ page }) => {
  await expect(page.getByTestId('lyrics-sheet')).toBeVisible({ timeout: 15_000 });
  // Either lyric lines or a titled empty state resolves — never a hung spinner.
  await expect(page.getByTestId('lyrics-lines').or(page.getByTestId('load-empty'))).toBeAttached({
    timeout: 15_000,
  });
});
