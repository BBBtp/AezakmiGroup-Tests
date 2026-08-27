import { test } from '@fixtures';
import { allure } from 'allure-playwright';

test.describe('Страница KPI', () => {
  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ kpiPage }) => {
    await kpiPage.navigate();
  });

  test('[TC-803] Кнопка настроек отображается и кликабельна', async ({ kpiPage, browserDiagnostics }) => {
    await allure.allureId('803');
    await kpiPage.expectSettingsActionVisible();
    const consoleErrors = browserDiagnostics.captureConsoleErrors('open KPI settings');
    await kpiPage.openSettings();
    consoleErrors.expectNoErrors();
    consoleErrors.stop();
  });

  test('[TC-804] Основной контент рендерится, error-content скрыт', async ({ kpiPage }) => {
    await allure.allureId('804');
    await kpiPage.expectMainContentVisible();
  });

  test('[TC-810] Таблица сотрудников отображается и можно открыть карточку сотрудника', async ({
    kpiPage,
  }) => {
    await allure.allureId('810');
    const table = kpiPage.employeesTable;

    await test.step('ПРОВЕРКА · Таблица сотрудников отображается', async () => {
      await table.expectPopulated();
    });
    await test.step('ДЕЙСТВИЕ · Открыть страницу сотрудника', async () => {
      await table.openFirstEmployee();
      await kpiPage.expectEmployeeDetailsUrl();
    });
  });
});
