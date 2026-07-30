/**
 * Real-world performance audit harness (ad-hoc, not part of the suite).
 * Drives a LOCAL build against the REAL Jellyfin server, signs in as the
 * cadence-test user, and captures for each screen: nav timing, request count,
 * total transfer, and the slowest requests. Prints a JSON report to stdout.
 *
 * Run: node scripts/perf-audit.mjs   (needs a server on :5173 + .env.local)
 * For an honest request count use a prod build (vite preview) — dev's
 * React.StrictMode double-invokes effects and inflates counts.
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const BASE = process.env.PERF_BASE || 'http://localhost:5173';
const USER = env.TEST_USERNAME || 'cadence-test';
const PASS = env.TEST_PASSWORD;
const SERVER = env.VITE_JELLYFIN_URL;

function attachNetwork(page) {
  const reqs = [];
  page.on('requestfinished', async (req) => {
    try {
      const res = await req.response();
      reqs.push({
        url: req.url(),
        status: res?.status(),
        ms: Math.round(req.timing().responseEnd),
        type: req.resourceType(),
      });
    } catch {
      /* ignore */
    }
  });
  return reqs;
}

function summarize(reqs, from, label) {
  const slice = reqs.slice(from);
  const api = slice.filter((r) => SERVER && r.url.startsWith(SERVER));
  const byPath = {};
  for (const r of api) {
    const path = r.url.replace(SERVER, '').split('?')[0].replace(/\/[a-f0-9]{32}/g, '/{id}');
    byPath[path] = (byPath[path] || 0) + 1;
  }
  const slowest = [...api].sort((a, b) => b.ms - a.ms).slice(0, 5);
  return {
    label,
    totalRequests: slice.length,
    apiRequests: api.length,
    apiByPath: Object.fromEntries(Object.entries(byPath).sort((a, b) => b[1] - a[1])),
    slowestApiMs: slowest.map((r) => ({ ms: r.ms, path: r.url.replace(SERVER, '').slice(0, 80) })),
  };
}

async function nav(page, path) {
  const t0 = Date.now();
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30_000 }).catch(() => {});
  return Date.now() - t0;
}

const report = { server: SERVER, user: USER, base: BASE, screens: [] };
const browser = await chromium.launch();
const page = await browser.newPage();
const reqs = attachNetwork(page);
await page.addInitScript((s) => window.localStorage.setItem('cadence.server-url', s), SERVER);

let mark = 0;
const signInMs = await nav(page, '/');
await page.getByTestId('signin-username').fill(USER).catch(() => {});
await page.getByTestId('signin-password').fill(PASS).catch(() => {});
await page.getByTestId('signin-submit').click().catch(() => {});
await page
  .waitForFunction(() => Object.keys(localStorage).some((k) => k.includes('cadence.session')), {
    timeout: 60_000,
  })
  .catch(() => {});
await page.waitForLoadState('networkidle').catch(() => {});
report.screens.push({ ...summarize(reqs, mark, 'sign-in→home'), navMs: signInMs });
mark = reqs.length;

const homeMs = await nav(page, '/home');
report.screens.push({ ...summarize(reqs, mark, 'home (reload)'), navMs: homeMs });
mark = reqs.length;

const searchMs = await nav(page, '/search');
await page.getByTestId('search-input').locator('input').fill('love').catch(() => {});
await page.waitForTimeout(1500);
report.screens.push({ ...summarize(reqs, mark, 'search "love"'), navMs: searchMs });
mark = reqs.length;

const libMs = await nav(page, '/library');
report.screens.push({ ...summarize(reqs, mark, 'library'), navMs: libMs });

console.log(JSON.stringify(report, null, 2));
await browser.close();
