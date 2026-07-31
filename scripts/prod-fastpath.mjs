/** Does prod Home actually SKIP the native shelf queries when the plugin serves
 * the fast path? Counts native shelf calls vs /Cadence/Home on a fresh Home load. */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const BASE = 'https://cadence.jpc.io';
const b = await chromium.launch();
const p = await b.newPage();
let home = 0;
const native = [];
p.on('request', (r) => {
  const u = r.url();
  if (/\/Cadence\/Home/.test(u)) home++;
  else if (/\/Items\/Suggestions|Items\/Latest|Filters=IsFavorite|Filters=IsPlayed|SortBy=DatePlayed/.test(u))
    native.push(u.replace(/\?.*/, '').replace('https://jellyfin.jpc.io', ''));
});
await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await p.getByTestId('signin-username').click();
await p.getByTestId('signin-username').pressSequentially(env.TEST_USERNAME, { delay: 10 });
await p.getByTestId('signin-password').click();
await p.getByTestId('signin-password').pressSequentially(env.TEST_PASSWORD, { delay: 10 });
await p.getByTestId('signin-submit').click();
await p
  .waitForFunction(() => Object.keys(localStorage).some((k) => k.includes('cadence.session')), { timeout: 60000 })
  .catch(() => {});
// Fresh Home load — this is where the race happens.
home = 0;
native.length = 0;
await p.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' });
await p.getByTestId('home-shelves').getByTestId('album-card').first().waitFor({ state: 'visible', timeout: 25000 }).catch(() => {});
await p.waitForTimeout(3000);
console.log(JSON.stringify({ cadenceHomeCalls: home, nativeShelfCalls: native.length, native }, null, 2));
await b.close();
