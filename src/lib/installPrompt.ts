/**
 * Captures the browser's `beforeinstallprompt` event so the app can offer an
 * "Install" button at a moment of its choosing (Settings). The event only fires
 * on installable PWAs that aren't already installed; we stash the latest one.
 */

/** The non-standard beforeinstallprompt event shape (Chromium). */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<(available: boolean) => void>();

function emit(): void {
  listeners.forEach((l) => l(deferred !== null));
}

/** Start listening for the install prompt. Call once at startup. */
export function initInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

/** Whether an install prompt is currently available. */
export function canInstall(): boolean {
  return deferred !== null;
}

/** Subscribe to availability changes; returns an unsubscribe fn. */
export function onInstallAvailability(listener: (available: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Show the native install prompt. Returns true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  emit();
  return outcome === 'accepted';
}
