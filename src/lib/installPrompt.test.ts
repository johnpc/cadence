import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canInstall,
  initInstallPrompt,
  onInstallAvailability,
  promptInstall,
  type InstallPromptEvent,
} from './installPrompt';

function fakeEvent(outcome: 'accepted' | 'dismissed'): InstallPromptEvent {
  return {
    preventDefault: vi.fn(),
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome }),
  } as unknown as InstallPromptEvent;
}

describe('installPrompt', () => {
  beforeEach(() => initInstallPrompt());
  afterEach(() => {
    // Reset module state by dispatching appinstalled (clears the deferred event).
    window.dispatchEvent(new Event('appinstalled'));
  });

  it('is unavailable until beforeinstallprompt fires', () => {
    expect(canInstall()).toBe(false);
  });

  it('becomes available and notifies subscribers when the event fires', () => {
    const seen: boolean[] = [];
    onInstallAvailability((a) => seen.push(a));
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), fakeEvent('accepted')));
    expect(canInstall()).toBe(true);
    expect(seen.at(-1)).toBe(true);
  });

  it('promptInstall returns true on accept and clears availability', async () => {
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), fakeEvent('accepted')));
    const accepted = await promptInstall();
    expect(accepted).toBe(true);
    expect(canInstall()).toBe(false);
  });

  it('promptInstall is a no-op when nothing is deferred', async () => {
    expect(await promptInstall()).toBe(false);
  });
});
