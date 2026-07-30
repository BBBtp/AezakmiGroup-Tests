import { test } from '@fixtures';
import { allure } from 'allure-playwright';

test.describe('Страница KPI Settings', () => {
  test.beforeEach(async ({ kpiPage }) => {
    await kpiPage.navigate();
  });

  test('Страница KPI Settings открывается и базовый каркас виден', async ({ kpiPage }) => {
    await allure.allureId('819');
    const settingsPage = await kpiPage.openSettings();

    await settingsPage.expectShellVisible();
  });

  test('Add-modal для ab-tests открывается и показывает шаги', async ({ kpiPage }) => {
    await allure.allureId('821');
    const settingsPage = await kpiPage.openSettings();
    const modal = await settingsPage.openAbTestsAddModal();

    await modal.expectShellVisible();
  });
});
