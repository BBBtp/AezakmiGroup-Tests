import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('KPI Settings UI', () => {
  test.beforeEach(async ({ kpiPage }) => {
    await kpiPage.navigate();
  });

  test('Базовые секции и таблицы отображаются', async ({ kpiPage }) => {
    await allure.allureId('820');
    const settingsPage = await kpiPage.openSettings();

    await settingsPage.expectBaseTablesVisible();
  });

  test('Add-modal для total-mrr открывается и показывает шаги', async ({ kpiPage }) => {
    await allure.allureId('822');
    const settingsPage = await kpiPage.openSettings();
    const modal = await settingsPage.openTotalMrrAddModal();

    await modal.expectShellVisible();
  });
});
