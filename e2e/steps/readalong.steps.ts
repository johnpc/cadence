import { createBdd } from 'playwright-bdd';
import { expect, type Page } from '@playwright/test';
import { DATA_WAIT } from './timeouts';
import { login, audiobookParts } from './jellyfinApi';

const { Given, When, Then } = createBdd();
const USERNAME = process.env.TEST_USERNAME;
const PASSWORD = process.env.TEST_PASSWORD;

/** The fixture book every read-along scenario plays (sorts first in the tab). */
const BOOK = 'Harbor Winds';
const CLIP_SECONDS = 4;

type Clip = { Start: number; End: number; Chapter: number; Fragment: string };

/**
 * A fake Storyteller bridge: the plugin's responses, generated from the REAL
 * fixture book (its part ids + durations come from the e2e Jellyfin), so the
 * timeline lines up with the audio actually playing. One 4 s sentence after
 * another across two chapters; sentence ids s1..sN.
 */
async function fixtureBook() {
  const s = await login(USERNAME as string, PASSWORD as string);
  const parts = await audiobookParts(s, BOOK);
  if (parts.length === 0) throw new Error(`fixture book "${BOOK}" has no parts on the e2e server`);
  const total = parts.reduce((sum, p) => sum + p.Duration, 0);
  const clips: Clip[] = [];
  const count = Math.floor(total / CLIP_SECONDS);
  for (let i = 0; i < count; i++) {
    clips.push({
      Start: i * CLIP_SECONDS,
      End: (i + 1) * CLIP_SECONDS,
      Chapter: i < count / 2 ? 0 : 1,
      Fragment: `s${i + 1}`,
    });
  }
  return {
    Status: 'ready',
    BookUuid: 'fixture-uuid',
    Title: BOOK,
    Duration: total,
    Parts: parts,
    Chapters: [
      { Href: 'OEBPS/text/ch1.xhtml', Title: 'Chapter One' },
      { Href: 'OEBPS/text/ch2.xhtml', Title: 'Chapter Two' },
    ],
    Clips: clips,
  };
}

function chapterXhtml(chapter: number, clips: Clip[]): string {
  const sentences = clips
    .filter((c) => c.Chapter === chapter)
    .map(
      (c) => `<p id="${c.Fragment}">Sentence ${c.Fragment.slice(1)} of chapter ${chapter + 1}.</p>`,
    )
    .join('\n');
  // A script that must NEVER run once the client has sanitized the chapter.
  return `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>c</title></head>
<body><script>window.__xss = 1</script><h2 id="h${chapter}">Chapter ${chapter + 1}</h2>${sentences}</body></html>`;
}

/** The book the fake bridge served, kept for failure messages. */
let servedParts: { ItemId: string; Duration: number }[] = [];

/** One line explaining the read-along state, for failure messages. */
async function readAlongState(page: Page): Promise<string> {
  const dom = await page.evaluate(() => {
    const a = document.querySelector('audio');
    const id = a?.src.match(/\/Audio\/([0-9a-f]+)\//)?.[1] ?? 'none';
    const active = document.querySelector('[data-testid="readalong-text"] [data-active="true"]');
    return `audio=${id} t=${a?.currentTime.toFixed(1) ?? '-'} active=${active?.id ?? 'none'}`;
  });
  return `${dom} parts=${servedParts.map((p) => `${p.ItemId}:${p.Duration.toFixed(0)}`).join(',')}`;
}

/** Install the fake bridge. `status` overrides the book's Status (e.g. unlinked). */
async function installBridge(page: Page, status: 'ready' | 'unlinked') {
  let book: Awaited<ReturnType<typeof fixtureBook>> | null = null;
  const getBook = async () => {
    book ??= await fixtureBook();
    servedParts = book.Parts;
    return book;
  };
  await page.route('**/Cadence/Config', (route) =>
    route.fulfill({ json: { Storyteller: true, LidarrProxy: false, DeezerImport: false } }),
  );
  await page.route('**/Cadence/Storyteller/Link', (route) =>
    route.fulfill({ json: { Linked: status !== 'unlinked', Username: 'reader' } }),
  );
  await page.route('**/Cadence/Storyteller/Books/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/Position')) return route.fulfill({ status: 204 });
    const b = await getBook();
    const text = url.pathname.match(/\/Text\/(.+)$/);
    if (text) {
      const href = decodeURIComponent(text[1]);
      const chapter = href.endsWith('ch2.xhtml') ? 1 : 0;
      return route.fulfill({
        status: 200,
        contentType: 'application/xhtml+xml',
        body: chapterXhtml(chapter, b.Clips),
      });
    }
    if (status === 'unlinked')
      return route.fulfill({ json: { ...b, Status: 'unlinked', Clips: [] } });
    return route.fulfill({ json: b });
  });
}

Given('the server offers Storyteller read-along for the fixture book', async ({ page }) => {
  await installBridge(page, 'ready');
});

Given('the server reports my Storyteller account is not linked', async ({ page }) => {
  await installBridge(page, 'unlinked');
});

When('I open read along', async ({ page }) => {
  const button = page.getByTestId('full-player-readalong');
  await expect(button).toBeVisible({ timeout: DATA_WAIT });
  await button.click();
  await expect(page.getByTestId('readalong-sheet')).toBeVisible({ timeout: DATA_WAIT });
});

/** The id of the highlighted sentence, or '' when none is highlighted. */
const activeId = (page: Page) =>
  page.evaluate(
    () => document.querySelector('[data-testid="readalong-text"] [data-active="true"]')?.id ?? '',
  );

Then('the chapter text is shown with the narrated sentence highlighted', async ({ page }) => {
  // Real rendered text from the (fake) bridge: the chapter heading plus a
  // highlighted sentence whose id is one of the generated anchors.
  const text = page.getByTestId('readalong-text');
  await expect(text).toBeVisible({ timeout: DATA_WAIT });
  await expect(text.getByRole('heading', { name: 'Chapter 1' })).toBeVisible({
    timeout: DATA_WAIT,
  });
  await expect.poll(() => activeId(page), { timeout: DATA_WAIT }).toMatch(/^s\d+$/);
  await expect(page.getByTestId('readalong-chapter')).toHaveText('Chapter One');
});

Then('the highlighted sentence advances with the audio', async ({ page, $testInfo }) => {
  const before = await activeId(page);
  // A still of the karaoke highlight for the PR demo / failure triage.
  await page.screenshot({ path: $testInfo.outputPath('readalong-highlight.png') });
  // Sentences are 4 s long: within DATA_WAIT the narration must move on.
  await expect
    .poll(async () => Number((await activeId(page)).slice(1)), {
      timeout: DATA_WAIT,
      message: `the highlight never moved past ${before}: ${await readAlongState(page)}`,
    })
    .toBeGreaterThan(Number(before.slice(1)));
});

Then('no script from the chapter ran', async ({ page }) => {
  expect(
    await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
  ).toBeUndefined();
});

let tappedStart = 0;

When('I tap a later sentence', async ({ page }) => {
  const current = await activeId(page);
  const n = Number(current.slice(1)) + 3;
  tappedStart = (n - 1) * CLIP_SECONDS;
  await page.getByTestId('readalong-text').locator(`#s${n}`).click();
});

Then('the audio jumps to that sentence', async ({ page }) => {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('audio')?.currentTime ?? -1), {
      timeout: DATA_WAIT,
    })
    .toBeGreaterThanOrEqual(tappedStart - 0.5);
  const want = Math.floor(tappedStart / CLIP_SECONDS) + 1;
  await expect
    .poll(async () => Number((await activeId(page)).slice(1)), {
      timeout: DATA_WAIT,
      message: `the highlight did not follow the seek to s${want}: ${await readAlongState(page)}`,
    })
    .toBeGreaterThanOrEqual(want);
});

Then("I am told the server's Storyteller setup is unfinished for my account", async ({ page }) => {
  // Nothing the listener can do in-app (accounts are the server maintainer's job), so the sheet
  // names who to ask and offers no setting or link.
  const box = page.getByTestId('readalong-unavailable');
  await expect(box).toBeVisible({ timeout: DATA_WAIT });
  await expect(box).toHaveAttribute('data-reason', 'unlinked');
  await expect(box.getByText("Storyteller isn't ready for your account")).toBeVisible();
  await expect(box.getByText('Ask whoever runs your server', { exact: false })).toBeVisible();
  await expect(box.getByRole('link')).toHaveCount(0);
});

const audioTime = (page: Page) =>
  page.evaluate(() => document.querySelector('audio')?.currentTime ?? -1);

let beforeSkip = 0;

When('I skip forward from the read-along sheet', async ({ page }) => {
  beforeSkip = await audioTime(page);
  await page.getByTestId('readalong-forward').click();
});

Then('the audio moved ahead and the text is still open', async ({ page }) => {
  // The sheet's own +30 s: the audio jumps while the text stays on screen — no
  // trip back to the player to skip.
  await expect
    .poll(() => audioTime(page), {
      timeout: DATA_WAIT,
      message: `audio did not move past ${beforeSkip}`,
    })
    .toBeGreaterThanOrEqual(beforeSkip + 20);
  await expect(page.getByTestId('readalong-text')).toBeVisible();
  await expect(page.getByTestId('readalong-book-progress-time')).toContainText('/');
});

When('I set the read-along speed to 1.5x', async ({ page }) => {
  await page.getByTestId('readalong-speed').click();
  await page
    .getByTestId('readalong-speed-option')
    .filter({ hasText: /^1\.5×$/ })
    .click();
});

Then('the audio plays at 1.5x and the text is still open', async ({ page }) => {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('audio')?.playbackRate ?? 0), {
      timeout: DATA_WAIT,
    })
    .toBe(1.5);
  await expect(page.getByTestId('readalong-speed')).toHaveText('1.5×');
  await expect(page.getByTestId('readalong-text')).toBeVisible();
});

When('I pause from the read-along sheet', async ({ page }) => {
  await page.getByTestId('readalong-toggle').click();
});

Then('the audio is paused and the text is still open', async ({ page }) => {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('audio')?.paused ?? false), {
      timeout: DATA_WAIT,
    })
    .toBe(true);
  await expect(page.getByTestId('readalong-text')).toBeVisible();
  await expect(page.getByTestId('readalong-toggle')).toHaveAttribute('aria-label', 'Play');
});
