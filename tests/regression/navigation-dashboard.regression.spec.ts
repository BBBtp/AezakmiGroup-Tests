import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { dashboardApi } from '@support/navigation/contracts';

const sections = [
  ['Dashboard', '/dashboard'],
  ['Success rate', '/success-rate', 'Statistics'],
  ['Subscriptions', '/subscriptions', 'Statistics'],
  ['Top-3000', '/keywords', 'Keywords'],
  ['Suggests', '/suggests', 'Keywords'],
  ['Checks', '/checks', 'Keywords'],
  ['Niche list', '/niches', 'Niches'],
  ['Sorted by apps', '/sorted-apps', 'Niches'],
  ['Push bots', '/push-bots', 'Push'],
  ['Out keywords', '/out-keywords', 'Push'],
  ['App list', '/app-list', 'ASA'],
  ['Performance', '/performance', 'ASA'],
  ['Net profit predict', '/net-profit-predict', 'ASA'],
  ['Task generator', '/task-generator'],
  ['Apps', '/apps'],
  ['A/B tests', '/ab-tests', 'Product'],
  ['KPI', '/kpi', 'Product'],
  ['Reviews and ratings', '/reviews'],
  ['Employees', '/employees', 'Staff'],
  ['Vacation schedule', '/schedule', 'Staff'],
  ['Users', '/users', 'Settings'],
  ['Parameters', '/parameters', 'Settings'],
] as const;

test.describe('Навигация и Dashboard', () => {
  test('Боковое меню содержит доступные разделы CRM', async ({ applicationShell, dashboardPage }) => {
    await allure.allureId('571');

    await dashboardPage.navigate();
    for (const [label, href, group] of sections) {
      await applicationShell.openSidebarDestination(label, href, group);
      await dashboardPage.navigate();
    }
  });

  test('Dashboard открывается из меню и содержит основные элементы', async ({ kpiPage, dashboardPage }) => {
    await allure.allureId('572');

    await kpiPage.navigate();
    await dashboardPage.openFromSidebar();
    await dashboardPage.expectBusinessControls();
  });

  test('Dashboard отображает метрики без технических значений после перезагрузки', async ({
    dashboardPage,
    network,
  }) => {
    await allure.allureId('574');

    await dashboardPage.navigate();
    await dashboardPage.expectMetricsHealthy();

    await network.reload({ waitUntil: 'commit' });
    await dashboardPage.expectLoaded();
    await dashboardPage.expectMetricsHealthy();
  });

  test('ошибка API Dashboard отображается и устраняется повторной загрузкой', async ({
    dashboardPage,
    network,
  }) => {
    await allure.allureId('660');
    await network.failNext(dashboardApi.chart, 'GET', { message: 'Test failure' });
    await dashboardPage.navigate();
    await dashboardPage.metrics.expectError();
    await network.reload();
    await dashboardPage.expectMetricsHealthy();
  });

  test('Dashboard показывает loading state до завершения загрузки', async ({ dashboardPage, network }) => {
    await allure.allureId('661');
    const held = await network.holdNext(dashboardApi.chart, 'GET');
    const opening = dashboardPage.navigate().catch(() => undefined);
    await held.started;
    await dashboardPage.metrics.expectLoading();
    await held.abort();
    await opening;
    await network.reload();
    await dashboardPage.expectMetricsHealthy();
  });

  test('Dashboard корректно отображает пустые метрики и восстанавливает данные', async ({
    dashboardPage,
    network,
  }) => {
    await allure.allureId('662');
    await network.fulfillNextJson(dashboardApi.chart, 'GET', dashboardApi.emptyChart);
    await dashboardPage.navigate();
    await dashboardPage.metrics.expectEmpty();
    await network.reload();
    await dashboardPage.expectMetricsHealthy();
  });
});
