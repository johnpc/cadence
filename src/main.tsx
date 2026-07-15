import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initTheme } from './features/theme/initTheme';
import { initInstallPrompt } from './lib/installPrompt';
import { registerServiceWorker } from './lib/registerServiceWorker';

// Apply the stored palette before first paint so there's no theme flash.
initTheme();

// Capture the PWA install prompt so Settings can offer an Install button.
initInstallPrompt();

// Register the PWA service worker — web only; NEVER in the native app (see the
// function's note: an SW on the Capacitor WKWebView can black-screen after an
// app update by serving a stale shell).
registerServiceWorker();

// Diagnostics wiring is not needed for first paint — load it in its own chunk
// after boot so it stays out of the entry bundle. Sets up the opt-in uploader
// (inert unless enabled + configured) and the iOS native→JS log bridge.
void import('./lib/diagnostics/initDiagnostics').then((m) => m.initDiagnostics());

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// The service worker (app-shell precache + offline + auto-update) is registered
// by vite-plugin-pwa's injected script — see VitePWA config in vite.config.ts.
