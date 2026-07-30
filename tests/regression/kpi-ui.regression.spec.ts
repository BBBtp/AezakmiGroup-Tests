import { allure } from 'allure-playwright';

import { test, testData } from '@fixtures';

test.describe('KPI UI', () => {
  test.beforeEach(async ({ kpiPage }) => {
    await kpiPage.navigate();
  });

  test('Подзаголовок отображается корректно', async ({ kpiPage }) => {
    await allure.allureId('802');
    await kpiPage.expectSubtitle(testData.texts.kpi.basePage.title);
  });

  test('При ошибке загрузки отображается error-content, main-content скрыт', async ({ kpiPage, network }) => {
    await allure.allureId('805');
    await network.failNext('**/staff/api/v1/kpi/managers/statistics*', 'GET', {
      message: 'Mocked server error',
    });
    const failedStatistics = network.waitForFailedResponse('/staff/api/v1/kpi/managers/statistics', 'GET');
    await network.navigate('/kpi', { waitUntil: 'domcontentloaded' });
    await failedStatistics;
    await kpiPage.expectErrorState();
  });

  test('Проверка отображения карточек KPI', async ({ kpiPage }) => {
    await allure.allureId('806');
    const { mrrCard, scoreCard, appsCard } = kpiPage.cards;

    await mrrCard.assertVisible(testData.texts.kpi.basePage.cardMrrTitle);
    await scoreCard.assertVisible(testData.texts.kpi.basePage.cardScoreTitle);
    await appsCard.assertVisible(testData.texts.kpi.basePage.cardAppsTitle);
  });

  test('Фильтры по месяцам видимы и работают', async ({ kpiPage }) => {
    await allure.allureId('807');
    const filters = kpiPage.filters;

    await filters.verifyVisible();
    await filters.verifyActiveTab();
  });

  test('График производительности отображается и табы переключаются', async ({
    kpiPage,
    browserDiagnostics,
  }) => {
    await allure.allureId('808');
    const chart = kpiPage.chart;
    const consoleErrors = browserDiagnostics.captureConsoleErrors('KPI performance chart');

    await chart.verifyVisible();
    await chart.selectMrr();
    consoleErrors.expectNoErrors();
    await chart.selectScore();
    consoleErrors.expectNoErrors();
    consoleErrors.stop();
  });

  test('Top Employees отображается', async ({ kpiPage }) => {
    await allure.allureId('809');
    const top = kpiPage.topEmployees;

    await top.verifyVisible('Top employees');
    await top.verifyPodium();
    await top.verifyContenders();
  });
});
