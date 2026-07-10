import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { DATA_WAIT } from './timeouts';

const { When, Then } = createBdd();

/** The library list on the surface that's actually on screen at CI width — the
 * desktop sidebar carries the same testids as the mobile page. */
function sidebar(page: import('@playwright/test').Page) {
  return page.getByTestId('desktop-sidebar');
}

When('I switch the library view', async ({ page }) => {
  await sidebar(page).getByTestId('library-view').click();
});

Then('the library is in list view', async ({ page }) => {
  await expect(sidebar(page).getByTestId('library-list')).toHaveAttribute('data-view', 'list', {
    timeout: DATA_WAIT,
  });
});

Then('the library is in grid view', async ({ page }) => {
  await expect(sidebar(page).getByTestId('library-list')).toHaveAttribute('data-view', 'grid', {
    timeout: DATA_WAIT,
  });
});
