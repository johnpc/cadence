import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      '.features-gen',
      'playwright-report',
      'test-results',
      // Isolated agent worktrees carry their own full copy of the repo — never
      // ours to lint (also keeps their coverage/* out of the run).
      '.claude',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Strict quality requirements: no `any`, ever.
      '@typescript-eslint/no-explicit-any': 'error',
      // Complexity is gated PER FUNCTION (cyclomatic ≤ 15 — the ceiling CRAP ≤ 15
      // already implies at full coverage; scripts/crap-check.mjs) — not per file.
      // A function over it
      // is extracted along a concept boundary; a long file is only a tripwire
      // (scripts/check-file-lines.mjs).
      complexity: ['error', 15],
      // Allow intentionally-unused args/vars prefixed with `_` — e.g. a
      // playwright-bdd step whose {string} placeholder must be in the signature
      // for arg-count but isn't needed in the body.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      // The core/extension boundary: core code reaches the acquisition tools
      // (Lidarr requests, Deezer import, Music Grabber) ONLY through the
      // registry (extensions/flags) and its slots — never their internals.
      // Root composition files (routes, lazy pages) and the extensions
      // themselves are exempt below.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/extensions/*/**', '!**/extensions/slots/*'],
              message:
                'Core code reaches extensions only via extensions/flags or extensions/slots/* (see src/extensions/flags.ts).',
            },
          ],
        },
      ],
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },
  {
    // Extensions use core freely; composition roots wire extension pages into
    // the router (lazily, so their code stays out of the core bundle).
    files: [
      'src/extensions/**/*.{ts,tsx}',
      'src/lazyPages.tsx',
      'src/appRouteList.tsx',
      'src/test/**',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
);
