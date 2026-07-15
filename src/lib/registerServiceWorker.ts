/**
 * Registers the app's service worker — but ONLY on the web/PWA, never inside the
 * Capacitor native app. On native, the app is served from capacitor://localhost
 * off the bundled filesystem; a service worker there is an anti-pattern and,
 * worse, an autoUpdate SW that precached one build's hashed asset names can, after
 * the native binary updates to new names, serve a stale index.html referencing JS
 * chunks that no longer exist — a black screen on launch. So we register manually
 * (VitePWA injectRegister is off) and skip it on native. The generated worker is
 * `sw.js` at the web root (see vite.config VitePWA).
 */
import { Capacitor } from '@capacitor/core';

export function registerServiceWorker(): void {
  if (Capacitor.isNativePlatform()) return; // native app: no SW, ever
  if (!('serviceWorker' in navigator)) return;
  // Register after load so it never competes with first paint / app boot.
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW registration is best-effort; the app works without it (no offline). */
    });
  });
}
