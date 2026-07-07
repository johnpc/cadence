// Minimal passthrough service worker. Its only job is to exist so the browser
// treats Cadence as an installable PWA. It caches nothing and intercepts
// nothing — every request goes straight to the network.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
