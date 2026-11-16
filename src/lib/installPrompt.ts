/**
 * Captures the browser's `beforeinstallprompt` event so the app can offer an
 * "Install" button at a moment of its choosing (Settings). The event only fires
 * on installable PWAs that aren't already installed; we stash the latest one.
 */

/** The non-standard beforeinstallprompt event shape (Chromium). */
import { createStore } from './store';

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** The deferred browser install prompt, or null when installing isn't offered. */
export const installPromptStore = createStore<InstallPromptEvent | null>(null);

/** Start listening for the install prompt. Call once at startup. */
export function initInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPromptStore.set(e as InstallPromptEvent);
  });
  window.addEventListener('appinstalled', () => installPromptStore.set(null));
}

/** Whether an install prompt is currently available. */
export const canInstall = (): boolean => installPromptStore.get() !== null;

/** Subscribe to availability changes; returns an unsubscribe fn. */
export const onInstallAvailability = (listener: (available: boolean) => void): (() => void) =>
  installPromptStore.subscribe(() => listener(canInstall()));

/** Show the native install prompt. Returns true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const deferred = installPromptStore.get();
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  installPromptStore.set(null);
  return outcome === 'accepted';
}
