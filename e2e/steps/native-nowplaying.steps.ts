import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { DATA_WAIT } from './timeouts';
import { navigate } from './app-shell.steps';

const { Given, When, Then } = createBdd();

/**
 * Native-bridge e2e helpers. The native iOS Now Playing path is detected purely
 * by the presence of `window.webkit.messageHandlers.cadenceNowPlaying` — so we
 * inject a FAKE one before app boot. It records every state the web player pushes
 * into `window.__nativePushes`, letting the browser exercise the real production
 * code (state sync, MediaSession stand-down, command handling) with no simulator.
 * The transport commands we fire are the exact `cadence:nowplaying:*` DOM events
 * the real Swift relay dispatches (see MainViewController.dispatchNowPlayingCommand).
 */
Given('the native now-playing bridge is present', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as {
      webkit?: { messageHandlers?: Record<string, { postMessage: (m: unknown) => void }> };
      __nativePushes?: unknown[];
    };
    w.__nativePushes = [];
    w.webkit = w.webkit ?? {};
    w.webkit.messageHandlers = w.webkit.messageHandlers ?? {};
    w.webkit.messageHandlers.cadenceNowPlaying = {
      postMessage: (msg: unknown) => {
        // The web layer posts a JSON string (see pushNowPlayingState).
        try {
          w.__nativePushes!.push(JSON.parse(msg as string));
        } catch {
          w.__nativePushes!.push(msg);
        }
      },
    };
  });
  // Re-navigate so the init script applies to a fresh document with the bridge
  // present from the very first line of app code (matches the DeviceId seed).
  await page.goto('/');
});

When('I play a playlist', async ({ page }) => {
  await navigate(page, 'Your Library');
  const rows = page.getByTestId('library-list').getByTestId('library-row');
  await expect(rows.first()).toBeVisible({ timeout: DATA_WAIT });
  const row = rows.filter({ hasNotText: 'Liked Songs' }).first();
  await expect(async () => {
    await row.click({ force: true }).catch(() => undefined);
    await expect(page).toHaveURL(/\/playlist\//, { timeout: 3_000 });
  }).toPass({ timeout: DATA_WAIT });
  const playAll = page.getByTestId('playlist-detail').getByTestId('play-all');
  await expect(playAll).toBeVisible({ timeout: DATA_WAIT });
  await playAll.click();
  await expect(page.getByTestId('now-playing-bar')).toBeAttached({ timeout: DATA_WAIT });
  await expect(page.getByTestId('now-playing-title')).toHaveText(/\S/, { timeout: DATA_WAIT });
});

/** The most recent state pushed to the fake native bridge (or null if none). */
const lastPush = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const pushes = (window as unknown as { __nativePushes?: unknown[] }).__nativePushes ?? [];
    return (pushes[pushes.length - 1] ?? null) as Record<string, unknown> | null;
  });

Then('native receives now-playing state for the current track', async ({ page }) => {
  // A real title with hasTrack true confirms the web→native STATE push ran.
  await expect
    .poll(async () => (await lastPush(page))?.hasTrack, { timeout: DATA_WAIT })
    .toBe(true);
  const title = await page.getByTestId('now-playing-title').innerText();
  expect((await lastPush(page))?.title).toBe(title.trim());
});

Then('the pushed state includes the queue index and count', async ({ page }) => {
  const state = await lastPush(page);
  // A playlist has a real queue — index is 0-based, count > 0 and > index. These
  // are exactly the fields native maps to MPNowPlayingInfoPropertyPlaybackQueue*.
  expect(typeof state?.queueIndex).toBe('number');
  expect(typeof state?.queueCount).toBe('number');
  expect(state?.queueCount as number).toBeGreaterThan(0);
  expect(state?.queueCount as number).toBeGreaterThan(state?.queueIndex as number);
});

When('native sends the {string} transport command', async ({ page }, command: string) => {
  // Fire the exact DOM event the Swift relay dispatches for this remote command.
  await page.evaluate((c) => window.dispatchEvent(new Event(`cadence:nowplaying:${c}`)), command);
});

When('native sends a seek command to {int} seconds', async ({ page }, seconds: number) => {
  await page.evaluate(
    (s) => window.dispatchEvent(new CustomEvent('cadence:nowplaying:seek', { detail: s })),
    seconds,
  );
});

Then('the next-up track becomes current', async ({ page }) => {
  // The queue advanced: the pushed queueIndex is now 1 (was 0 on first play).
  await expect.poll(async () => (await lastPush(page))?.queueIndex, { timeout: DATA_WAIT }).toBe(1);
});

Then('the first track is current again', async ({ page }) => {
  await expect.poll(async () => (await lastPush(page))?.queueIndex, { timeout: DATA_WAIT }).toBe(0);
});

Then('the audio position is about {int} seconds', async ({ page }, seconds: number) => {
  // The seek command drove the real audio element's currentTime.
  await expect
    .poll(() => page.evaluate(() => document.querySelector('audio')?.currentTime ?? 0), {
      timeout: DATA_WAIT,
    })
    .toBeGreaterThan(seconds - 5);
});

Then('the web MediaSession publishes no metadata', async ({ page }) => {
  // On native the WKWebView MediaSession stands down — no metadata is set, so the
  // OS has a single owner (the native bridge). jsdom-free: real Chromium has the API.
  const meta = await page.evaluate(() => {
    const ms = navigator.mediaSession as MediaSession | undefined;
    return ms ? ms.metadata : undefined;
  });
  expect(meta ?? null).toBeNull();
});
