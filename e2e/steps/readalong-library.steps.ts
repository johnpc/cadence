import { createBdd } from 'playwright-bdd';
import { expect, type Page } from '@playwright/test';
import { DATA_WAIT } from './timeouts';

const { When, Then } = createBdd();

const rows = (page: Page) => page.getByTestId('audiobooks').getByTestId('book-row');
const rowOf = (page: Page, title: string) => rows(page).filter({ hasText: title }).first();

Then('{string} is marked ready to read along', async ({ page }, title: string) => {
  const badge = rowOf(page, title).getByTestId('readalong-badge');
  await expect(badge).toHaveAttribute('data-status', 'ready', { timeout: DATA_WAIT });
  await expect(badge).toHaveText('Read along');
});

Then('{string} is marked as still aligning', async ({ page }, title: string) => {
  const badge = rowOf(page, title).getByTestId('readalong-badge');
  await expect(badge).toHaveAttribute('data-status', 'aligning', { timeout: DATA_WAIT });
  await expect(badge).toHaveText('Aligning…');
});

When('I filter the books to {string}', async ({ page }, label: string) => {
  const chip = page
    .getByRole('group', { name: 'Filter books' })
    .getByRole('button', { name: label });
  await chip.click({ timeout: DATA_WAIT });
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
});

Then('only {string} is listed', async ({ page }, title: string) => {
  // Every row left (both sections) is that book, and it is there.
  await expect(rowOf(page, title)).toBeVisible({ timeout: DATA_WAIT });
  await expect(rows(page).filter({ hasNotText: title })).toHaveCount(0);
});

Then('{string} is listed again', async ({ page }, title: string) => {
  await expect(rowOf(page, title)).toBeVisible({ timeout: DATA_WAIT });
});

When('I open the book {string}', async ({ page }, title: string) => {
  await rowOf(page, title).getByTestId('book-row-open').click({ timeout: DATA_WAIT });
  await expect(page.getByTestId('book-title')).toHaveText(title, { timeout: DATA_WAIT });
});

Then("the book's page says it is still aligning", async ({ page }) => {
  const badge = page.getByTestId('book-header').getByTestId('readalong-badge');
  await expect(badge).toHaveText('Aligning…', { timeout: DATA_WAIT });
});
