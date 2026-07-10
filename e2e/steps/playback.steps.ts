import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { navigate, searchUntilResults } from './app-shell.steps';

const { When, Then } = createBdd();

When('I arm a 30 minute sleep timer in settings', async ({ page }) => {
  // The timer lives on the Settings screen; arm it, then return to Home so the
  // mini-player is on screen to open. Player state is app-level, so it persists.
  await page.goto('/settings');
  const opt = page.getByTestId('sleep-30');
  await expect(opt).toBeVisible({ timeout: DATA_WAIT });
  await opt.click();
  await expect(opt).toHaveAttribute('aria-pressed', 'true');
  await navigate(page, 'Home');
});

Then('I see the sleep timer indicator', async ({ page }) => {
  await expect(page.getByTestId('sleep-indicator')).toBeVisible({ timeout: DATA_WAIT });
  await expect(page.getByTestId('sleep-indicator')).toHaveText(/Sleep in 30 min/);
});

When('I cancel the sleep timer from the player', async ({ page }) => {
  await page.getByTestId('sleep-cancel').click();
});

Then('the sleep timer indicator is gone', async ({ page }) => {
  await expect(page.getByTestId('sleep-indicator')).toHaveCount(0, { timeout: DATA_WAIT });
});

When('I tap a track from search', async ({ page }) => {
  // Home is now recommendation shelves (no flat track list), so drive playback
  // from Search, which lists individual tracks. searchUntilResults re-fires the
  // query if a transient hiccup means no results land in time.
  await navigate(page, 'Search');
  await searchUntilResults(page, 'love', 'search-results');
  const row = page.getByTestId('search-results').getByTestId('track-row-play').first();
  await row.click();
  // Confirm playback actually STARTED before returning — otherwise downstream
  // steps (open full player, repeat/shuffle keys) race an empty queue and time
  // out on the now-playing bar. The bar renders as soon as the queue has a
  // current track (pure state, independent of audio decoding).
  await expect(page.getByTestId('now-playing-bar')).toBeAttached({ timeout: DATA_WAIT });
});

Then('the Now-Playing bar shows a track', async ({ page }) => {
  // Assert attachment, not viewport visibility: on nested routes (e.g. /liked)
  // Ionic keeps the tab-slot mini-player attached but flags it "not visible".
  await expect(page.getByTestId('now-playing-bar')).toBeAttached({ timeout: DATA_WAIT });
  // Wait for the title TEXT to populate (data budget) — the bar can attach a
  // tick before current.Name lands; a no-timeout not.toBeEmpty() races that.
  await expect(page.getByTestId('now-playing-title')).toHaveText(/\S/, { timeout: DATA_WAIT });
});

Then('the audio element is loaded with a Jellyfin stream', async ({ page }) => {
  // The one long-lived <audio> gets a Jellyfin universal-stream src on play.
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio');
    return !!audio?.src && audio.src.includes('/Audio/') && audio.src.includes('/universal');
  });
});

When('I open the full player', async ({ page }) => {
  // Ensure the mini-player is actually on screen before tapping it to expand —
  // clicking before it mounts was a source of timeouts on now-playing-open.
  const open = page.getByTestId('now-playing-open');
  await expect(open).toBeVisible({ timeout: DATA_WAIT });
  await open.click();
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
    timeout: DATA_WAIT,
  });
});

When('I press the {string} key', async ({ page }, key: string) => {
  // Click empty chrome first so focus isn't in a text field (shortcuts no-op
  // while typing). The full player's own surface is a safe click target.
  await page.getByTestId('full-player').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press(key);
});

Then('the full player shows the next-up track', async ({ page }) => {
  // With a multi-track queue playing, the full player shows a "Next: <song>"
  // hint above the queue. It carries the upcoming track's name.
  const hint = page.getByTestId('full-player-next-up');
  await expect(hint).toBeVisible({ timeout: DATA_WAIT });
  await expect(hint).toContainText('Next');
});

Then('shuffle is on', async ({ page }) => {
  // The shuffle control gains the "--on" state class when active.
  const shuffle = page.getByTestId('full-player-shuffle');
  await expect(shuffle).toHaveClass(/fullplayer__ctl--on/, { timeout: DATA_WAIT });
});

When('I tap the repeat button', async ({ page }) => {
  await page.getByTestId('full-player-repeat').click({ force: true });
});

Then('repeat is set to {string}', async ({ page }, mode: string) => {
  // The repeat control's aria-label reflects the current mode (off/all/one).
  await expect(page.getByTestId('full-player-repeat')).toHaveAttribute(
    'aria-label',
    `Repeat ${mode}`,
    { timeout: DATA_WAIT },
  );
});

When('I open lyrics', async ({ page }) => {
  const btn = page.getByTestId('full-player-lyrics');
  await btn.scrollIntoViewIfNeeded();
  await btn.click({ force: true });
});

Then('the lyrics sheet is shown', async ({ page }) => {
  await expect(page.getByTestId('lyrics-sheet')).toBeVisible({ timeout: DATA_WAIT });
  // Either lyric lines or a titled empty state resolves — never a hung spinner.
  await expect(page.getByTestId('lyrics-lines').or(page.getByTestId('load-empty'))).toBeAttached({
    timeout: DATA_WAIT,
  });
});

When('I open the queue', async ({ page }) => {
  const btn = page.getByTestId('full-player-queue');
  await btn.scrollIntoViewIfNeeded();
  await btn.click({ force: true });
  await expect(page.getByTestId('queue-view')).toBeVisible({ timeout: DATA_WAIT });
});

Then('I can save the queue as a playlist', async ({ page }) => {
  // The "Save as playlist" action prompts for a name (a real playlist create
  // would mutate the shared server, so we assert the prompt opens, not submit).
  const save = page.getByTestId('queue-save');
  await expect(save).toBeVisible({ timeout: DATA_WAIT });
  await save.click({ force: true });
  // The name prompt (an IonAlert) opens. Other alerts may be mounted-but-hidden,
  // so match the one showing our header rather than the bare element.
  await expect(page.locator('ion-alert:has-text("Save queue as playlist")')).toBeVisible({
    timeout: DATA_WAIT,
  });
});

When('I tap the artist in the full player', async ({ page }) => {
  // The artist line under the now-playing title links to the artist page.
  const link = page.getByTestId('full-player-artists').getByRole('link').first();
  await expect(link).toBeVisible({ timeout: DATA_WAIT });
  await link.click({ force: true });
});

Then('I see the artist page', async ({ page }) => {
  await expect(page.getByTestId('artist-radio')).toBeAttached({ timeout: DATA_WAIT });
});
