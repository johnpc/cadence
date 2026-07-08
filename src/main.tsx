import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initTheme } from './features/theme/initTheme';
import { registerServiceWorker } from './lib/registerServiceWorker';
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

// Make the app installable as a PWA.
registerServiceWorker();
