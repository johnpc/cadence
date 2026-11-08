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

When('I choose the {string} library sort', async ({ page }, label: string) => {
  // IonSelect (interface="popover") opens a popover of radio options on click.
  // The popover mounts at the app root (not in the sidebar); click the visible
  // radio option by its exact label (role=option also matches the hidden
  // <ion-select-option> template, which trips strict mode).
  //
  // Choosing an option starts the popover's dismiss animation. A second choice
  // made while it is still fading lands its select-click on the old backdrop
  // (opening nothing) and then waits on the old popover's radio as it detaches.
  // So: wait for any previous popover to be gone, pick inside the open one,
  // and wait for that one to close before the next step.
  const popover = page.locator('ion-popover');
  await expect(popover).toHaveCount(0, { timeout: DATA_WAIT });
  await sidebar(page).getByTestId('library-sort').click();
  await popover.getByRole('radio', { name: label, exact: true }).click();
  await expect(popover).toHaveCount(0, { timeout: DATA_WAIT });
});

Then('the library sort is {string}', async ({ page }, mode: string) => {
  await expect(sidebar(page).getByTestId('library-sort')).toHaveAttribute('data-sort', mode, {
    timeout: DATA_WAIT,
  });
});
