import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('ASA → Net profit predict', () => {
  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('[TC-992] скрывает будущие месяцы только для текущего года', async ({ netProfitPredictPage }) => {
    await allure.allureId('992');
    const now = new Date();
    await netProfitPredictPage.openFromSidebar(now);
    await netProfitPredictPage.content.expectCurrentYearMonths(now);

    const previousYear = now.getFullYear() - 1;
    await netProfitPredictPage.content.selectYear(previousYear);
    await netProfitPredictPage.content.expectCompleteYear(previousYear);
  });

  test('[TC-994] сохраняет App-фильтр и период в searchParams после reload', async ({
    netProfitPredictPage,
    network,
  }) => {
    await allure.allureId('994');
    const now = new Date();
    await netProfitPredictPage.openFromSidebar(now);
    const appFilter = await netProfitPredictPage.content.changeAppFilterSelection();
    const previousYear = now.getFullYear() - 1;
    await netProfitPredictPage.content.selectYear(previousYear);

    const params = await netProfitPredictPage.content.searchParams();
    await netProfitPredictPage.content.expectSearchParams({
      App: appFilter,
      filters: 'App',
      period: String(previousYear),
      fromDate: `${previousYear}-01-01`,
      toDate: `${previousYear}-12-01`,
    });

    await network.reload({ waitUntil: 'commit' });
    await netProfitPredictPage.content.expectLoaded(now.getFullYear());
    await netProfitPredictPage.content.expectYearSelected(previousYear);
    await netProfitPredictPage.content.expectSearchParams(params);
  });

  test('[TC-995] показывает раскрытую строку фильтров с закреплённым App: All', async ({
    netProfitPredictPage,
  }) => {
    await allure.allureId('995');
    await netProfitPredictPage.openFromSidebar(new Date());
    await netProfitPredictPage.content.expectDefaultExpandedAndPinnedApp();
  });

  test('[TC-996] сворачивает и повторно раскрывает строку фильтров', async ({ netProfitPredictPage }) => {
    await allure.allureId('996');
    await netProfitPredictPage.openFromSidebar(new Date());
    await netProfitPredictPage.content.expectFilterRowToggle();
  });

  test('[TC-997] выбирает год и применяет произвольный период из календаря', async ({
    netProfitPredictPage,
  }) => {
    await allure.allureId('997');
    const now = new Date();
    await netProfitPredictPage.openFromSidebar(now);
    await netProfitPredictPage.content.expectPeriodCalendar(now.getFullYear() - 1, now.getFullYear());
  });

  test('[TC-998] применяет значения фильтра App status', async ({ netProfitPredictPage }) => {
    await allure.allureId('998');
    await netProfitPredictPage.openFromSidebar(new Date());
    await netProfitPredictPage.content.expectAppStatusFilter();
  });

  test('[TC-999] поддерживает Select all, поиск и частичный выбор App', async ({ netProfitPredictPage }) => {
    await allure.allureId('999');
    await netProfitPredictPage.openFromSidebar(new Date());
    await netProfitPredictPage.content.selectSingleApp();
  });

  test('[TC-1000] фильтрует данные по Team и сохраняет выбор после reload', async ({
    netProfitPredictPage,
    network,
  }) => {
    await allure.allureId('1000');
    await netProfitPredictPage.openFromSidebar(new Date());
    await netProfitPredictPage.content.selectTeam('Aezakmi');
    const params = await netProfitPredictPage.content.searchParams();
    await network.reload({ waitUntil: 'commit' });
    await netProfitPredictPage.content.expectLoaded(new Date().getFullYear());
    await netProfitPredictPage.content.expectSearchParams(params);
  });

  test('[TC-1001] показывает пустое состояние для несовместимых фильтров и сбрасывает их', async ({
    netProfitPredictPage,
  }) => {
    await allure.allureId('1001');
    await netProfitPredictPage.openFromSidebar(new Date());
    await netProfitPredictPage.content.selectSingleApp();
    await netProfitPredictPage.content.selectTeam('AppEmpire');
    await netProfitPredictPage.content.expectNoResultsAndReset();
  });
});
