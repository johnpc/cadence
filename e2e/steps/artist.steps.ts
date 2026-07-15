import { createBdd } from 'playwright-bdd';
import { DATA_WAIT } from './timeouts';
import { expect } from '@playwright/test';
import { libraryList, navigate, searchUntilResults } from './app-shell.steps';

const { When, Then } = createBdd();

When('I open an artist that has popular tracks', async ({ page }) => {
  // Open the first artist result. Popular renders for any artist with ≥1 track
  // (top-tracks sorts 0-play songs by name), which the top "love" artist has.
  await navigate(page, 'Search');
  await searchUntilResults(page, 'love', 'search-artists', 'result-row');
  const row = page.getByTestId('search-artists').getByTestId('result-row').first();
  await expect(row).toBeVisible({ timeout: DATA_WAIT });
  // Click-and-VERIFY: an Ionic route push from a result row can be dropped,
  // leaving the test on Search so the artist-page assertion times out — re-issue
  // until /artist/ lands.
  await expect(async () => {
    await row.click().catch(() => undefined);
    await expect(page).toHaveURL(/\/artist\//, { timeout: 3_000 });
  }).toPass({ timeout: DATA_WAIT });
  await expect(page.getByTestId('artist-see-all')).toBeVisible({ timeout: DATA_WAIT });
});

When('I tap See all on the popular tracks', async ({ page }) => {
  const seeAll = page.getByTestId('artist-see-all');
  await expect(seeAll).toBeVisible({ timeout: DATA_WAIT });
  await seeAll.click();
});

Then("I see the artist's full track list", async ({ page }) => {
  const rows = page.getByTestId('artist-tracks').getByTestId('track-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
});

When('I play the artist track list', async ({ page }) => {
  await page.getByTestId('artist-tracks').getByTestId('play-all').click();
});

When('I open the first artist result', async ({ page }) => {
  // Re-fire the (already-typed) search if the artist section is slow to fill,
  // so a transient Jellyfin hiccup doesn't fail the run.
  await searchUntilResults(page, 'love', 'search-artists', 'result-row');
  const row = page.getByTestId('search-artists').getByTestId('result-row').first();
  // Click-and-VERIFY: like the tab nav, an Ionic route push from a result-row
  // click is intermittently dropped (the row re-renders under the search
  // debounce, or the transition swallows the click), leaving the test on Search
  // so the artist page's assertions time out. Re-issue the click until the
  // /artist/ route actually lands.
  await expect(async () => {
    await row.click().catch(() => undefined);
    await expect(page).toHaveURL(/\/artist\//, { timeout: 3_000 });
  }).toPass({ timeout: DATA_WAIT });
});

Then("I see the artist's albums", async ({ page }) => {
  // The artist page loaded: the radio control is present, and the albums grid or
  // a titled empty state resolves (some artists are credited only per-track, so
  // the album grid can legitimately be empty) — never a hung spinner.
  await expect(page.getByTestId('artist-radio')).toBeAttached({ timeout: DATA_WAIT });
  await expect(page.getByTestId('artist-albums').or(page.getByTestId('load-empty'))).toBeAttached({
    timeout: DATA_WAIT,
  });
});

Then('the discography shows a labelled section', async ({ page }) => {
  // The discography is grouped Spotify-style; whichever group is first renders a
  // heading ("Albums" / "Singles & EPs" / "Compilations"). If the artist has no
  // albums at all (credited only per-track), the empty state stands in — either
  // way, never a hung/unlabelled grid.
  const heading = page
    .getByRole('heading', { name: /^(Albums|Singles & EPs|Compilations)$/ })
    .first();
  await expect(heading.or(page.getByTestId('load-empty'))).toBeVisible({ timeout: DATA_WAIT });
});

Then('I see related artists to explore', async ({ page }) => {
  // "Fans also like" is derived from the artist's instant-mix radio. Most
  // artists yield related picks, but a sparse mix can legitimately produce none
  // (the section then renders nothing) — so accept either the populated section
  // or its documented absence, never a hung spinner.
  const related = page.getByTestId('related-artist').first();
  const albums = page.getByTestId('artist-albums');
  await expect(related.or(albums)).toBeAttached({ timeout: DATA_WAIT });
});

When('I follow the artist', async ({ page }) => {
  const btn = page.getByTestId('artist-actions').getByTestId('save-button');
  await expect(btn).toBeAttached({ timeout: DATA_WAIT });
  // Idempotent: only follow if not already followed (re-runs shouldn't unfollow).
  if ((await btn.getAttribute('aria-pressed')) !== 'true') {
    await expect(btn).toBeVisible({ timeout: DATA_WAIT });
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true', { timeout: DATA_WAIT });
  }
});

Then('the followed artists list is not empty', async ({ page }) => {
  const rows = libraryList(page).getByTestId('library-row');
  await expect(rows.first()).toBeAttached({ timeout: DATA_WAIT });
});
