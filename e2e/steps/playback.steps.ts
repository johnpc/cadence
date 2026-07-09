import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { navigate, searchUntilResults } from './app-shell.steps';

const { When, Then } = createBdd();

When('I tap a track from search', async ({ page }) => {
  // Home is now recommendation shelves (no flat track list), so drive playback
  // from Search, which lists individual tracks. searchUntilResults re-fires the
  // query if a transient hiccup means no results land in time.
  await navigate(page, 'Search');
  await searchUntilResults(page, 'love', 'search-results');
  await page.getByTestId('search-results').getByTestId('track-row-play').first().click();
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

When('I press the {string} key', async ({ page }, key: string) => {
  // Click empty chrome first so focus isn't in a text field (shortcuts no-op
  // while typing). The full player's own surface is a safe click target.
  await page.getByTestId('full-player').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press(key);
});

Then('shuffle is on', async ({ page }) => {
  // The shuffle control gains the "--on" state class when active.
  const shuffle = page.getByTestId('full-player-shuffle');
  await expect(shuffle).toHaveClass(/fullplayer__ctl--on/, { timeout: 15_000 });
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

When('I open the queue', async ({ page }) => {
  const btn = page.getByTestId('full-player-queue');
  await btn.scrollIntoViewIfNeeded();
  await btn.click({ force: true });
  await expect(page.getByTestId('queue-view')).toBeVisible({ timeout: 15_000 });
});

Then('I can save the queue as a playlist', async ({ page }) => {
  // The "Save as playlist" action prompts for a name (a real playlist create
  // would mutate the shared server, so we assert the prompt opens, not submit).
  const save = page.getByTestId('queue-save');
  await expect(save).toBeVisible({ timeout: 15_000 });
  await save.click({ force: true });
  // The name prompt (an IonAlert) opens. Other alerts may be mounted-but-hidden,
  // so match the one showing our header rather than the bare element.
  await expect(page.locator('ion-alert:has-text("Save queue as playlist")')).toBeVisible({
    timeout: 15_000,
  });
});

When('I tap the artist in the full player', async ({ page }) => {
  // The artist line under the now-playing title links to the artist page.
  const link = page.getByTestId('full-player-artists').getByRole('link').first();
  await expect(link).toBeVisible({ timeout: 15_000 });
  await link.click({ force: true });
});

Then('I see the artist page', async ({ page }) => {
  await expect(page.getByTestId('artist-radio')).toBeAttached({ timeout: 30_000 });
});
