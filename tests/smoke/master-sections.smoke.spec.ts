import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('Основные разделы CRM', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('Statistics открывается из бокового меню и показывает основные контролы', async ({
    browserDiagnostics,
    statisticsPage,
  }) => {
    await allure.allureId('575');
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open Statistics');

    await statisticsPage.openFromSidebar();

    consoleErrors.expectNoErrors();
  });

  test('Top-3000 открывается из бокового меню и показывает основные контролы', async ({
    browserDiagnostics,
    topKeywordsPage,
  }) => {
    await allure.allureId('578');
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open Top-3000');

    await topKeywordsPage.openFromSidebar();

    consoleErrors.expectNoErrors();
  });

  test('Suggests открывается из бокового меню и показывает основные контролы', async ({
    browserDiagnostics,
    suggestsPage,
  }) => {
    await allure.allureId('583');
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open Suggests');

    await suggestsPage.openFromSidebar();

    consoleErrors.expectNoErrors();
  });

  test('Checks открывается из бокового меню и показывает основные контролы', async ({
    browserDiagnostics,
    checksPage,
  }) => {
    await allure.allureId('586');
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open Checks');

    await checksPage.openFromSidebar();
    await checksPage.expectBusinessControls();

    consoleErrors.expectNoErrors();
  });

  test('Niches открывается из бокового меню и показывает основные контролы', async ({
    browserDiagnostics,
    nichesPage,
  }) => {
    await allure.allureId('592');
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open Niches');

    await nichesPage.openFromSidebar();

    consoleErrors.expectNoErrors();
  });
});
