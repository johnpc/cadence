import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initTheme } from './features/theme/initTheme';
import { initInstallPrompt } from './lib/installPrompt';
import { initDiagnosticsUpload } from './lib/diagnostics/diagnosticsUploader';
import { initNativeDiagnosticsBridge } from './lib/diagnostics/nativeDiagnosticsBridge';
import { registerServiceWorker } from './lib/registerServiceWorker';

// Apply the stored palette before first paint so there's no theme flash.
initTheme();

// Capture the PWA install prompt so Settings can offer an Install button.
initInstallPrompt();

// Wire the opt-in diagnostics uploader to the log store + page lifecycle. Inert
// unless the user enabled upload AND the backend is configured (see uploader).
initDiagnosticsUpload();

// Let the iOS native layer record its own events into the same log pipeline.
initNativeDiagnosticsBridge();

// Register the PWA service worker — web only; NEVER in the native app (see the
// function's note: an SW on the Capacitor WKWebView can black-screen after an
// app update by serving a stale shell).
registerServiceWorker();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// The service worker (app-shell precache + offline + auto-update) is registered
// by vite-plugin-pwa's injected script — see VitePWA config in vite.config.ts.
