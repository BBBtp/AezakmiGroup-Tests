import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import { subscriptionTableResponse } from '@support/subscriptions/contracts';

test.describe('Statistics → Subscriptions', () => {
  const filtersResponse = [
    { apphud_app_id: 'front-130-alpha', app_name: 'Alpha' },
    { apphud_app_id: 'front-130-beta', app_name: 'Beta' },
    { apphud_app_id: 'front-130-gamma', app_name: 'Gamma' },
  ];
  const alphaStatistics = subscriptionTableResponse({
    appId: 'front-130-alpha',
    appName: 'Alpha',
    appleId: '1111111111',
    productId: 'alpha.monthly',
    totals: [101, 202, 303, 404, 505, 606, 707],
  });
  const betaStatistics = subscriptionTableResponse({
    appId: 'front-130-beta',
    appName: 'Beta',
    appleId: '2222222222',
    productId: 'beta.yearly',
    totals: [111, 222, 333, 444, 555, 666, 777],
  });

  test.describe('FRONT-130 filter label', () => {
    test.beforeEach(
      'ПОДГОТОВКА · Подготовить предусловия сценария',
      async ({ dashboardPage, network, subscriptionsPage }) => {
        await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
        await network.fulfillJsonSequence(
          '**/api/v1/subscriptions/table*',
          'GET',
          Array.from({ length: 4 }, () => alphaStatistics),
        );
        await dashboardPage.navigate();
        await subscriptionsPage.openFromStatisticsGroup();
      },
    );

    test('[TC-918] Select All отображается как All', async ({ subscriptionsPage }) => {
      await allure.allureId('918');
      await subscriptionsPage.selectAllAppsAndExpectAllLabel();
    });

    test('[TC-919] Частичный выбор не отображается как All', async ({ subscriptionsPage }) => {
      await allure.allureId('919');
      await subscriptionsPage.selectAllThenDeselectOneAppAndExpectPartialLabel();
    });
  });

  test('[TC-916] метрики подписок соответствуют ответу API', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('916');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillNextJson('**/api/v1/subscriptions/table*', 'GET', alphaStatistics);

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.expectMetrics(
      ['101', '202', '303', '404', '505', '606', '707'],
      'Alpha',
      'alpha.monthly',
    );
  });

  test('[TC-917] App-фильтр обновляет и сбрасывает статистику подписок', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('917');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillJsonSequence('**/api/v1/subscriptions/table*', 'GET', [
      alphaStatistics,
      betaStatistics,
    ]);

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.expectFilteredApp('Alpha', 'Beta');

    const filtered = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.selectApp('Beta'),
    );
    await scenarioCheck.contains(
      'Запрос таблицы содержит выбранное приложение Beta',
      decodeURIComponent(filtered.response.request().url()),
      'apphud_app_ids=front-130-beta',
    );
    await subscriptionsPage.expectFilteredApp('Beta', 'Alpha');

    await subscriptionsPage.resetAppFilter();
    await subscriptionsPage.expectFilteredApp('Alpha', 'Beta');
  });
});
