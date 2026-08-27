import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('ASA → App list', () => {
  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('[TC-868] открывает страницу и корректно показывает пустой список', async ({
    appListPage,
    network,
  }) => {
    await allure.allureId('868');
    await appListPage.openFromSidebar();
    await network.mockJson('**/master/api/v1/asa/apps?*', 'GET', {
      items: [],
      total: 0,
      last_sync_in: null,
    });
    await network.reload();
    await appListPage.content.expectEmptyState();
  });

  test('[TC-869] фильтрует приложения по статусу и команде', async ({ appListPage }) => {
    await allure.allureId('869');
    await appListPage.openFromSidebar();
    await appListPage.content.selectStatus('In progress');
    await appListPage.content.expectVisibleRowsHaveStatus('In progress');
    await appListPage.content.selectTeam('AppEmpire');
  });

  test('[TC-870] переключает период и открывает календарь диапазона', async ({ appListPage }) => {
    await allure.allureId('870');
    await appListPage.openFromSidebar();
    await appListPage.content.selectPeriod('3 months');
    await appListPage.content.selectPeriod('6 months');
    await appListPage.content.selectPeriod('1 month');
    await appListPage.content.openCalendar();
    await appListPage.content.selectCalendarMonthRange('February', 'August');
  });

  test('[TC-871] ищет приложение и сохраняет контракт таблицы', async ({ appListPage }) => {
    await allure.allureId('871');
    await appListPage.openFromSidebar();
    await appListPage.content.searchFirstVisibleApp();
  });

  test('[TC-872] поддерживает пагинацию и горизонтальную навигацию таблицы', async ({ appListPage }) => {
    await allure.allureId('872');
    await appListPage.openFromSidebar();
    await appListPage.content.goToNextPage();
    await appListPage.content.expectHorizontalTableNavigation();
  });

  test('[TC-873] показывает загрузку и валидацию формы добавления приложения', async ({ appListPage }) => {
    await allure.allureId('873');
    await appListPage.openFromSidebar();
    await appListPage.content.openAddApp();
    await appListPage.content.addModal.expectLoadingState();
    await appListPage.content.addModal.expectReadyForInput();
    await appListPage.content.addModal.close();
  });
});
