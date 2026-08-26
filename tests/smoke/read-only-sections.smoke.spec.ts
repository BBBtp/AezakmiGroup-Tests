import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('Read-only разделы CRM', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('A/B tests открывается и показывает ключевые контролы', async ({
    browserDiagnostics,
    readOnlySectionsPage,
  }) => {
    await allure.allureId('620');
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open A/B tests');

    await readOnlySectionsPage.openFromSidebar('abTests');

    consoleErrors.expectNoErrors();
  });

  test('Employees открывается и показывает список сотрудников', async ({
    browserDiagnostics,
    employeesPage,
  }) => {
    await allure.allureId('637');
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open Employees');

    await employeesPage.openFromSidebar();

    consoleErrors.expectNoErrors();
  });

  test('Vacation schedule открывается и показывает календарные контролы', async ({
    browserDiagnostics,
    readOnlySectionsPage,
  }) => {
    await allure.allureId('642');
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open Vacation schedule');

    await readOnlySectionsPage.openFromSidebar('vacationSchedule');

    consoleErrors.expectNoErrors();
  });

  test('Users открывается и показывает административные действия', async ({
    browserDiagnostics,
    readOnlySectionsPage,
  }) => {
    await allure.allureId('646');
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open Users');

    await readOnlySectionsPage.openFromSidebar('users');

    consoleErrors.expectNoErrors();
  });
});
