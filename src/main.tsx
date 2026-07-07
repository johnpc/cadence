import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initTheme } from './features/theme/initTheme';
import { registerServiceWorker } from './lib/registerServiceWorker';

// Apply the stored palette before first paint so there's no theme flash.
initTheme();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Make the app installable as a PWA.
registerServiceWorker();
