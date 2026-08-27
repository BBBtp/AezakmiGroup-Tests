import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test('[TC-591] Checks Archive открывается и возвращает в список', async ({ checksPage, dashboardPage }) => {
  await allure.allureId('591');

  await dashboardPage.navigate();
  await checksPage.openFromSidebar();
  await checksPage.expectArchiveRoundTrip();
});
