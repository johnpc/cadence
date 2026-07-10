import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initTheme } from './features/theme/initTheme';
import { initInstallPrompt } from './lib/installPrompt';

// Apply the stored palette before first paint so there's no theme flash.
initTheme();

// Capture the PWA install prompt so Settings can offer an Install button.
initInstallPrompt();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// The service worker (app-shell precache + offline + auto-update) is registered
// by vite-plugin-pwa's injected script — see VitePWA config in vite.config.ts.
