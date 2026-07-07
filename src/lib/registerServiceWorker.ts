/**
 * Registers the passthrough service worker so the browser treats Cadence as an
 * installable PWA. No-ops where service workers are unsupported. Registration
 * failures are non-fatal — the app still runs, it just isn't installable.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener(
    'load',
    () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed', err);
      });
    },
    { once: true },
  );
}
