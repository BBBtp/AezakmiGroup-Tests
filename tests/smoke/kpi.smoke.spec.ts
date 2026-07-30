import { test } from '@fixtures';
import { allure } from 'allure-playwright';

test.describe('Страница KPI', () => {
  test.beforeEach(async ({ kpiPage }) => {
    await kpiPage.navigate();
  });

  test('Кнопка настроек отображается и кликабельна', async ({ kpiPage, browserDiagnostics }) => {
    await allure.allureId('803');
    await kpiPage.expectSettingsActionVisible();
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open KPI settings');
    await kpiPage.openSettings();
    consoleErrors.expectNoErrors();
    consoleErrors.stop();
  });

  test('Основной контент рендерится, error-content скрыт', async ({ kpiPage }) => {
    await allure.allureId('804');
    await kpiPage.expectMainContentVisible();
  });

  test('Таблица сотрудников отображается и можно открыть карточку сотрудника', async ({ kpiPage }) => {
    await allure.allureId('810');
    const table = kpiPage.employeesTable;

    await test.step('Таблица отображается', async () => {
      await table.expectPopulated();
    });
    await test.step('Кнопка Open открывает страницу сотрудника', async () => {
      await table.openFirstEmployee();
      await kpiPage.expectEmployeeDetailsUrl();
    });
  });
});
