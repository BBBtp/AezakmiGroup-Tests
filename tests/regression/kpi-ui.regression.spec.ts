import { allure } from 'allure-playwright';

import { test, testData } from '@fixtures';
import {
  assessKpiDataset,
  hasKpiData,
  kpiDataUnavailableMessage,
  openKpiAndGetStatistics,
} from '@support/kpi';

test.describe('KPI UI', () => {
  test('Подзаголовок отображается корректно', async ({ kpiPage }) => {
    await allure.allureId('802');
    await kpiPage.navigate();
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
    await kpiPage.navigate();
    const { mrrCard, scoreCard, appsCard } = kpiPage.cards;

    await mrrCard.assertVisible(testData.texts.kpi.basePage.cardMrrTitle);
    await scoreCard.assertVisible(testData.texts.kpi.basePage.cardScoreTitle);
    await appsCard.assertVisible(testData.texts.kpi.basePage.cardAppsTitle);
  });

  test('Фильтры по месяцам видимы и работают', async ({ kpiPage }) => {
    await allure.allureId('807');
    await kpiPage.navigate();
    const filters = kpiPage.filters;

    await filters.verifyVisible();
    await filters.verifyActiveTab();
  });

  test('График производительности отображается и табы переключаются', async ({
    kpiPage,
    browserDiagnostics,
  }) => {
    await allure.allureId('808');
    await kpiPage.navigate();
    const chart = kpiPage.chart;
    const consoleErrors = browserDiagnostics.captureConsoleErrors('KPI performance chart');

    await chart.verifyVisible();
    await chart.selectMrr();
    consoleErrors.expectNoErrors();
    await chart.selectScore();
    consoleErrors.expectNoErrors();
    consoleErrors.stop();
  });

  test('Top Employees отображается', async ({ kpiPage, network }) => {
    await allure.allureId('809');
    const dataset = assessKpiDataset(await openKpiAndGetStatistics(kpiPage, network));
    test.skip(!hasKpiData(dataset, 'contenders'), kpiDataUnavailableMessage(dataset, 'contenders'));
    const top = kpiPage.topEmployees;

    await top.verifyVisible('Top employees');
    await top.verifyPodium();
    await top.verifyContenders();
  });
});
