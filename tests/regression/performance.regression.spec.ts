import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('ASA Performance', () => {
  test.beforeEach('ПОДГОТОВКА · Открыть CRM с авторизованной сессией', async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('[TC-836] открывает раздел и показывает корректное системное состояние', async ({
    browserDiagnostics,
    performancePage,
  }) => {
    await allure.allureId('836');
    const consoleErrors = browserDiagnostics.captureConsoleErrors('загрузка Performance');

    await performancePage.openFromSidebar();

    await performancePage.content.expectBusinessBlocks();
    consoleErrors.expectNoErrors();
  });

  test('[TC-837] показывает согласованные бизнес-блоки для периода с данными', async ({
    performancePage,
  }) => {
    await allure.allureId('837');

    await performancePage.openFromSidebar();

    await performancePage.content.expectBusinessBlocks();
    await performancePage.content.expectTableStructure();
  });

  test('[TC-839] открывает интерфейс доступных фильтров', async ({ performancePage }) => {
    await allure.allureId('839');

    await performancePage.openFromSidebar();

    await performancePage.content.expectFilterInterface();
  });

  test('[TC-840] переключает показатели графика динамики', async ({ performancePage }) => {
    await allure.allureId('840');

    await performancePage.openFromSidebar();

    await performancePage.content.switchChartMetrics();
  });

  test('[TC-841] показывает структуру таблицы и итоговую строку', async ({ performancePage }) => {
    await allure.allureId('841');

    await performancePage.openFromSidebar();

    await performancePage.content.expectTableStructure();
  });

  test('[TC-842] раскрывает и сворачивает детализацию приложения по GEO', async ({ performancePage }) => {
    await allure.allureId('842');

    await performancePage.openFromSidebar();

    await performancePage.content.expandAndCollapseGeoRows();
  });

  test('[TC-843] ищет приложение и восстанавливает список после очистки', async ({ performancePage }) => {
    await allure.allureId('843');

    await performancePage.openFromSidebar();

    await performancePage.content.verifyApplicationSearch();
  });

  test('[TC-844] изменяет количество строк таблицы', async ({ performancePage }) => {
    await allure.allureId('844');

    await performancePage.openFromSidebar();

    await performancePage.content.verifyPagination();
  });

  test('[TC-845] сохраняет доступность таблицы при прокрутке', async ({ performancePage }) => {
    await allure.allureId('845');

    await performancePage.openFromSidebar();

    await performancePage.content.verifyScrolling();
  });
});
