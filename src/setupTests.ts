// jest-dom adds custom matchers for asserting on DOM nodes. The /vitest
// entrypoint (jest-dom v6+) augments vitest's `expect`, not jest's — required
// under TS7's stricter module resolution for toBeInTheDocument et al. to type.
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Raise the default async timeout so waitFor assertions don't flake under the
// CPU contention of the pre-commit hook / CI (build + tests running together).
configure({ asyncUtilTimeout: 5000 });

// Mock matchMedia (jsdom has none). Includes the modern addEventListener API the
// ThemeProvider uses to track the OS appearance — the default 'system' theme
// calls this on app start, so a partial mock would crash rendering.
window.matchMedia =
  window.matchMedia ||
  function (query: string) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: function () {},
      removeEventListener: function () {},
      addListener: function () {},
      removeListener: function () {},
      dispatchEvent: function () {
        return false;
      },
    } as unknown as MediaQueryList;
  };
