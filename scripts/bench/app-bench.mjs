#!/usr/bin/env node
/**
 * End-to-end load benchmark: how long the REAL app (a production build served
 * by `vite preview`) takes to show Home and Audiobooks against a real Jellyfin,
 * in a real browser, on a home connection and on an emulated phone network.
 *
 *   BENCH_USER=… BENCH_PASS=… node scripts/bench/app-bench.mjs \
 *     --base http://localhost:4173 --label main --runs 5
 *
 * Scenarios (each repeated --runs times, median + p90 reported):
 *   home-first   signed in, every client cache cleared → Home fully rendered
 *   home-warm    the same, reloaded with caches → Home fully rendered
 *   books-first  signed in, caches cleared → Audiobooks list rendered
 * Profiles: wifi (no throttling) and lte (70 ms RTT, 9/3 Mbps via CDP).
 * "Rendered" = the page's data containers are present AND no LoadState
 * spinner/skeleton remains, so it measures what the user waits for.
 *
 * Signs in ONCE (one Jellyfin session per run of this script) and revokes the
 * token at the end. Writes JSON lines to --out (default /tmp/app-bench-<label>.jsonl).
 */
import { chromium } from '@playwright/test';
import { writeFileSync, appendFileSync } from 'node:fs';

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : dflt;
};
const BASE = arg('base', 'http://localhost:4173');
const LABEL = arg('label', 'run');
const RUNS = Number(arg('runs', '5'));
const OUT = arg('out', `/tmp/app-bench-${LABEL}.jsonl`);
const USER = process.env.BENCH_USER;
const PASS = process.env.BENCH_PASS;
if (!USER || !PASS) {
  console.error('BENCH_USER and BENCH_PASS are required');
  process.exit(1);
}

const PROFILES = {
  wifi: null,
  lte: {
    offline: false,
    latency: 70,
    downloadThroughput: (9e6 / 8) | 0,
    uploadThroughput: (3e6 / 8) | 0,
  },
};
/** Keys that make up "signed in"; everything else in localStorage is cache. */
const KEEP = [
  'CapacitorStorage.cadence.session',
  'CapacitorStorage.cadence.device-id',
  'cadence.server-url',
  'CapacitorStorage.cadence.server-url',
];

const browser = await chromium.launch();

async function signIn() {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.getByTestId('signin-username').click();
  await page.getByTestId('signin-username').pressSequentially(USER, { delay: 8 });
  await page.getByTestId('signin-password').click();
  await page.getByTestId('signin-password').pressSequentially(PASS, { delay: 8 });
  await page.getByTestId('signin-submit').click();
  await page.waitForFunction(
    () => !!localStorage.getItem('CapacitorStorage.cadence.session'),
    undefined,
    { timeout: 60_000 },
  );
  const state = await page.evaluate((keep) => {
    const out = {};
    for (const k of keep) {
      const v = localStorage.getItem(k);
      if (v !== null) out[k] = v;
    }
    return out;
  }, KEEP);
  await ctx.close();
  return state;
}

const READY = {
  home: () => {
    const shelves = document.querySelector('[data-testid="home-shelves"]');
    return (
      !!shelves &&
      shelves.querySelectorAll('.shelf').length >= 3 &&
      !document.querySelector('[data-testid="load-loading"]')
    );
  },
  books: () =>
    document.querySelectorAll('[data-testid="book-row"]').length > 0 &&
    !document.querySelector('[data-testid="load-loading"]'),
};

async function measure(state, route, ready, profile, warm) {
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  await ctx.addInitScript((s) => {
    if (sessionStorage.getItem('__bench_seeded')) return;
    sessionStorage.setItem('__bench_seeded', '1');
    localStorage.clear();
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, state);
  const page = await ctx.newPage();
  if (PROFILES[profile]) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', PROFILES[profile]);
  }
  // Jellyfin API calls vs cover-image loads, counted until the page is ready.
  let api = 0;
  let images = 0;
  let counting = false;
  page.on('request', (r) => {
    if (!counting || r.url().startsWith(BASE)) return;
    if (/\/Images\//.test(r.url())) images++;
    else api++;
  });
  const go = async () => {
    api = 0;
    images = 0;
    counting = true;
    const t0 = Date.now();
    await page.goto(`${BASE}${route}`, { waitUntil: 'commit' });
    await page.waitForFunction(ready, undefined, { timeout: 90_000, polling: 50 });
    counting = false;
    return { ms: Date.now() - t0, api, images };
  };
  let r = await go();
  if (warm) {
    // Let the first load's caches persist, then measure the reload.
    await page.waitForTimeout(1500);
    r = await go();
  }
  await ctx.close();
  return r;
}

const percentile = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

writeFileSync(OUT, '');
const state = await signIn();
const scenarios = [
  ['home-first', '/home', READY.home, false],
  ['home-warm', '/home', READY.home, true],
  ['books-first', '/audiobooks', READY.books, false],
];
const summary = [];
for (const profile of Object.keys(PROFILES)) {
  for (const [name, route, ready, warm] of scenarios) {
    const samples = [];
    for (let i = 0; i < RUNS; i++) {
      try {
        const r = await measure(state, route, ready, profile, warm);
        samples.push(r);
        appendFileSync(OUT, JSON.stringify({ label: LABEL, profile, name, run: i, ...r }) + '\n');
      } catch (e) {
        appendFileSync(
          OUT,
          JSON.stringify({ label: LABEL, profile, name, run: i, error: String(e).slice(0, 200) }) +
            '\n',
        );
      }
    }
    const ms = samples.map((s) => s.ms);
    summary.push({
      label: LABEL,
      profile,
      name,
      ok: `${samples.length}/${RUNS}`,
      medianMs: ms.length ? percentile(ms, 50) : null,
      p90Ms: ms.length ? percentile(ms, 90) : null,
      apiCalls: samples.length
        ? percentile(
            samples.map((s) => s.api),
            50,
          )
        : null,
      images: samples.length
        ? percentile(
            samples.map((s) => s.images),
            50,
          )
        : null,
    });
  }
}
// Revoke the benchmark's session so it doesn't linger on the server.
try {
  const s = JSON.parse(state['CapacitorStorage.cadence.session']);
  const server = (
    state['cadence.server-url'] ||
    state['CapacitorStorage.cadence.server-url'] ||
    ''
  ).replace(/"/g, '');
  if (server) {
    await fetch(`${server.replace(/\/$/, '')}/Sessions/Logout`, {
      method: 'POST',
      headers: {
        Authorization: `MediaBrowser Client="cadence-bench", Device="bench", DeviceId="bench", Version="1", Token="${s.token}"`,
      },
    });
  }
} catch {
  /* best-effort */
}
await browser.close();
console.table(summary);
console.log(JSON.stringify(summary));
