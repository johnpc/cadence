/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// https://vitejs.dev/config/
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react(), legacy()],
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
        'src/AppTabRoutes.tsx',
        'src/AppLoading.tsx',
        // Render-only route code-splitting glue (React.lazy wrappers).
        'src/lazyPages.tsx',
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
