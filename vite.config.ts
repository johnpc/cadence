/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// https://vitejs.dev/config/
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    legacy(),
    // Precache the FULL build (entry + vendor + every lazy route chunk + CSS)
    // via Workbox so the PWA opens instantly on repeat visits and boots OFFLINE
    // — the passthrough SW cached nothing, so the app was blank with no network.
    // Only same-origin static assets are precached; the cross-origin Jellyfin
    // API + audio streams are never touched. autoUpdate: a new deploy's SW takes
    // over and reloads once. We keep our own manifest.json (don't let the plugin
    // generate one).
    VitePWA({
      registerType: 'autoUpdate',
      // Register the service worker OURSELVES (see main.tsx) instead of letting the
      // plugin inject an unconditional script — the SW must NOT run inside the
      // Capacitor native app (served from capacitor://localhost). There, an
      // autoUpdate SW that precached the previous build's hashed asset names can,
      // after the native binary updates to new names, serve a stale index.html
      // referencing JS chunks that no longer exist → a black screen on launch. So
      // registration is guarded to web only.
      injectRegister: null,
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        // Never serve the SPA shell for the runtime config or cross-origin calls.
        navigateFallbackDenylist: [/^\/config\.js$/],
        cleanupOutdatedCaches: true,
        // Durable, bounded cover-art cache at the SW layer. Jellyfin cover art is
        // immutable (URLs carry an image `tag`) and CORS `*`, so CacheFirst is
        // safe: once fetched, an <img> is served from the SW with ZERO network —
        // it survives the browser HTTP cache being evicted (which happens fast in
        // an installed PWA on mobile) and works fully offline. Bounded to 500
        // covers / 60 days so it can't grow without limit. Only cross-origin
        // /Images/ requests match; API JSON + audio streams are untouched.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/Items\/[^/]+\/Images\//.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cadence-cover-art',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // The vendor chunk (Ionic + React) is legitimately ~1.4MB and cached
    // separately from app code; don't warn on it.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Split the big, rarely-changing framework code into its own `vendor`
        // chunk so it stays cached across app-only deploys (app code changes far
        // more often than React/Ionic do) and the entry chunk shrinks. One chunk
        // for all node_modules avoids the circular graph between React and
        // Ionic's react-router bridge.
        manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // Generous timeout so async hook/waitFor tests don't flake under the CPU
    // contention of the pre-commit hook (build + tests running together).
    testTimeout: 15000,
    // Acceptance tests live in e2e/ and run under Playwright, not Vitest.
    // .features-gen/ holds Playwright-BDD's generated specs — never Vitest's.
    // `.claude` holds isolated agent worktrees — each carries its own copy of
    // the suite; without this they'd be collected twice and pollute runs.
    exclude: ['node_modules', 'dist', 'e2e', '.features-gen', '.idea', '.git', '.cache', '.claude'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      // Measure EVERY source LOGIC file, even untested ones.
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      // Excluded: tests, type decls, setup, and the render-only entrypoints
      // (App.tsx / main.tsx) whose logic lives in tested hooks/helpers.
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        'src/setupTests.ts',
        // Render-only composition roots: wire providers/routes together, no
        // logic to test. Their tokens/fonts imports also break jsdom.
        'src/main.tsx',
        'src/App.tsx',
        'src/AppRoutes.tsx',
        'src/AppTabs.tsx',
        'src/AppLoading.tsx',
        // Render-only route code-splitting glue (React.lazy wrappers).
        'src/lazyPages.tsx',
        // Render-only route table (a list of <Route> elements, no logic).
        'src/appRouteList.tsx',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
