import { createBdd } from 'playwright-bdd';
import { expect, type Page } from '@playwright/test';
import { DATA_WAIT } from './timeouts';
import { bookGroupId, login, logout } from './jellyfinApi';

const { When, Then } = createBdd();
const USERNAME = process.env.TEST_USERNAME as string;
const PASSWORD = process.env.TEST_PASSWORD as string;

/** What the book page's Share put on the clipboard (per page). */
const copied = new WeakMap<Page, string>();

When('I share the book', async ({ page }) => {
  // Deterministic share: no OS share sheet (desktop Chrome may expose
  // navigator.share and pop a native dialog), and capture the clipboard write
  // instead of relying on clipboard permissions — the app falls back to copy.
  await page.evaluate(() => {
    const w = window as unknown as { __copied?: string };
    Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async (t: string) => void (w.__copied = t) },
      configurable: true,
    });
  });
  await page.getByTestId('book-header').getByTestId('share-button').click();
  await expect(page.getByText('Link copied')).toBeVisible({ timeout: DATA_WAIT });
  const link = await page.evaluate(
    () => (window as unknown as { __copied?: string }).__copied ?? '',
  );
  copied.set(page, link);
});

Then('the copied link is a readable link to {string}', async ({ page }, slug: string) => {
  const link = copied.get(page) ?? '';
  expect(link).toMatch(new RegExp(`/audiobook/${slug}-[0-9a-f]{8}$`));
});

When('I open the copied link', async ({ page }) => {
  const link = copied.get(page);
  expect(link, 'nothing was copied').toBeTruthy();
  await page.goto(new URL(link as string).pathname);
});

When('I open the book link {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

When(
  'I open the readable link to the book {string} while signed out',
  async ({ page }, title: string) => {
    const s = await login(USERNAME, PASSWORD);
    try {
      const id = await bookGroupId(s, title);
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      await page.goto(`/audiobook/${slug}-${id.slice(0, 8)}`);
    } finally {
      await logout(s.token);
    }
    await expect(page.getByTestId('signin-submit')).toBeVisible({ timeout: DATA_WAIT });
  },
);

Then('I see the book {string}', async ({ page }, title: string) => {
  await expect(page.getByTestId('book-detail')).toBeVisible({ timeout: DATA_WAIT });
  await expect(page.getByTestId('book-title')).toHaveText(title, { timeout: DATA_WAIT });
});

const APP_ID = 'JW5SC3NYUV.com.johncorser.cadence';
let association: unknown = null;

When("I fetch the site's apple-app-site-association file", async ({ request }) => {
  const res = await request.get('/.well-known/apple-app-site-association');
  expect(res.status()).toBe(200);
  // The SPA fallback would answer with index.html — that is exactly the failure
  // this guards against (iOS then silently ignores the association).
  association = JSON.parse(await res.text());
});

Then('it is JSON that names the Cadence iOS app for every path', () => {
  const details = (
    association as { applinks: { details: { appIDs: string[]; components: { '/': string }[] }[] } }
  ).applinks.details;
  const mine = details.find((d) => d.appIDs.includes(APP_ID));
  expect(mine, `no applinks entry for ${APP_ID}`).toBeTruthy();
  expect(mine?.components.some((c) => c['/'] === '/*')).toBe(true);
});
