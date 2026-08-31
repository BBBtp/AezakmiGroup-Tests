import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import {
  subscriptionChartResponse,
  subscriptionPartialTableResponse,
  subscriptionTableForApps,
  subscriptionTableResponse,
  type SubscriptionAppOptions,
} from '@support/subscriptions/contracts';

test.describe('Statistics → Subscriptions — design coverage', () => {
  const filtersResponse = [
    { apphud_app_id: 'design-alpha', app_name: 'Design Alpha 1111111111 Aezakmi' },
    { apphud_app_id: 'design-beta', app_name: 'Design Beta' },
  ];
  const alpha: SubscriptionAppOptions = {
    appId: 'design-alpha',
    appName: 'Design Alpha 1111111111 Aezakmi',
    appleId: '1111111111',
    productId: 'design.alpha.monthly',
    totals: [101, 202, 303, 404, 505, 606, 707],
  };
  const beta: SubscriptionAppOptions = {
    appId: 'design-beta',
    appName: 'Design Beta',
    appleId: '2222222222',
    productId: 'design.beta.yearly',
    totals: [111, 222, 333, 444, 555, 666, 777],
  };
  const alphaTable = subscriptionTableResponse(alpha);
  const chart = subscriptionChartResponse();

  test('[TC-1092] Daily сравнивает выбранную дату с предыдущим днём и показывает частичные данные', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('1092');
    await subscriptionsPage.setFixedTime('2026-08-24T05:00:00.000Z');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillNextJson(
      '**/api/v1/subscriptions/table*',
      'GET',
      subscriptionPartialTableResponse([101, 202, 303, 404, 505, 606, 707]),
    );

    await dashboardPage.navigate();
    const initial = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.openFromStatisticsGroup(),
    );
    const requestUrl = new URL(initial.response.url());
    const fromDate = requestUrl.searchParams.get('from_date');
    const toDate = requestUrl.searchParams.get('to_date');
    await scenarioCheck.isTrue('Daily передаёт обе границы диапазона дат', Boolean(fromDate && toDate));
    const dayDifference =
      (Date.parse(`${toDate ?? ''}T00:00:00Z`) - Date.parse(`${fromDate ?? ''}T00:00:00Z`)) / 86_400_000;
    await scenarioCheck.equal('Daily использует предыдущий день как from_date', dayDifference, 1);
    await subscriptionsPage.daily.expectPartialMetrics(['101', '707']);
  });

  test('[TC-923] предустановленная и произвольная даты обновляют Daily statistics', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('923');
    await subscriptionsPage.setFixedTime('2026-08-12T05:00:00.000Z');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillJsonSequence('**/api/v1/subscriptions/table*', 'GET', [
      alphaTable,
      subscriptionTableResponse(beta),
      alphaTable,
      subscriptionTableResponse(beta),
    ]);

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    const preset = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.daily.selectPreset(1),
    );
    await scenarioCheck.contains(
      'Preset-период передан в запрос Daily statistics',
      decodeURIComponent(preset.response.url()),
      preset.result,
    );
    await subscriptionsPage.expectMetrics(['111', '777'], beta.appName, beta.productId);

    const thirdPreset = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.daily.selectPreset(2),
    );
    await scenarioCheck.contains(
      'Третий preset-период передан в запрос',
      decodeURIComponent(thirdPreset.response.url()),
      thirdPreset.result,
    );
    await subscriptionsPage.expectMetrics(['101', '707'], alpha.appName, alpha.productId);

    const custom = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.daily.selectCalendarDay(5),
    );
    await scenarioCheck.contains(
      'Произвольная конечная дата передана в запрос',
      decodeURIComponent(custom.response.url()),
      '2026-08-05',
    );
    await subscriptionsPage.expectMetrics(['111', '777'], beta.appName, beta.productId);
  });

  test('[TC-925] Daily table отображает структуру приложения, GEO и подписок', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }, testInfo) => {
    await allure.allureId('925');
    testInfo.snapshotSuffix = '';
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillNextJson('**/api/v1/subscriptions/table*', 'GET', alphaTable);

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.daily.expectTableStructure(alpha.appName, alpha.appleId, alpha.productId);
    await subscriptionsPage.daily.expectAppStoreLink(alpha.appleId);
    await subscriptionsPage.daily.expectScreenshot();
  });

  test('[TC-926] строка All разворачивает Daily statistics по GEO', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('926');
    const geoTable = subscriptionTableResponse({ ...alpha, geos: ['total', 'US', 'MX', 'RU'] });
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillNextJson('**/api/v1/subscriptions/table*', 'GET', geoTable);

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.daily.expandAllGeoAndExpect('US', 'MX', 'RU');
    await subscriptionsPage.daily.collapseAllGeoAndExpectHidden('US', 'MX', 'RU');
  });

  test('[TC-927] сортировка и поиск управляют Daily table', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('927');
    const full = subscriptionTableForApps([alpha, beta]);
    const empty = subscriptionTableForApps([]);
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillJsonSequence('**/api/v1/subscriptions/table*', 'GET', [
      full,
      full,
      full,
      full,
      alphaTable,
      empty,
      full,
    ]);

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    const sorted = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.daily.sortBy('revenue'),
    );
    const firstSortUrl = new URL(sorted.response.url());
    await scenarioCheck.equal(
      'Первая сортировка выполняется по revenue',
      firstSortUrl.searchParams.get('order_by'),
      'revenue',
    );
    await scenarioCheck.equal(
      'Первая сортировка использует asc',
      firstSortUrl.searchParams.get('order'),
      'asc',
    );

    const reversed = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.daily.sortBy('revenue'),
    );
    await scenarioCheck.equal(
      'Повторная сортировка использует desc',
      new URL(reversed.response.url()).searchParams.get('order'),
      'desc',
    );

    const numericSort = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.daily.sortBy('subscriptions'),
    );
    await scenarioCheck.equal(
      'Числовая сортировка выполняется по subscriptions',
      new URL(numericSort.response.url()).searchParams.get('order_by'),
      'subscriptions',
    );

    const matching = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.daily.searchFor(alpha.appName),
    );
    await scenarioCheck.equal(
      'Поиск передаёт имя приложения',
      new URL(matching.response.url()).searchParams.get('pattern'),
      alpha.appName,
    );
    await subscriptionsPage.daily.expectSearchResult(alpha.appName, beta.appName);

    const searched = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.daily.searchFor('Missing app'),
    );
    await scenarioCheck.equal(
      'Поиск без совпадений передаёт pattern',
      new URL(searched.response.url()).searchParams.get('pattern'),
      'Missing app',
    );
    await subscriptionsPage.daily.expectEmptySearch();

    await subscriptionsPage.daily.clearSearchAndExpectApps(alpha.appName, beta.appName);
  });

  test('[TC-928] пагинация и горизонтальный скролл Daily table работают согласованно', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('928');
    const paged = subscriptionTableForApps([alpha, beta], 25);
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillJsonSequence('**/api/v1/subscriptions/table*', 'GET', [paged, paged, paged, paged]);

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.setViewport(1280, 720);
    await subscriptionsPage.daily.expectHorizontalOverflow();
    await subscriptionsPage.daily.expectPagination(3);
    const nextPage = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.daily.goToNextPage(),
    );
    await scenarioCheck.equal(
      'Следующая страница передаёт offset 10',
      new URL(nextPage.response.url()).searchParams.get('offset'),
      '10',
    );

    await subscriptionsPage.daily.goToPreviousPage();

    const resized = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/table', method: 'GET', status: 200 },
      () => subscriptionsPage.daily.selectRowsPerPage(20),
    );
    await scenarioCheck.equal(
      'Изменение размера страницы передаёт limit 20',
      new URL(resized.response.url()).searchParams.get('limit'),
      '20',
    );
    await scenarioCheck.equal(
      'Изменение размера страницы сбрасывает offset',
      new URL(resized.response.url()).searchParams.get('offset'),
      '0',
    );
    await subscriptionsPage.daily.expectPagination(2);
  });

  test('[TC-929] Daily loading и ошибка API завершаются управляемым состоянием', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('929');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    const held = await network.holdNext('**/api/v1/subscriptions/table*', 'GET');

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroupUntilLoading();
    await held.started;
    await subscriptionsPage.daily.expectLoading();
    await held.abort();
    await subscriptionsPage.daily.expectError();
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillNextJson('**/api/v1/subscriptions/table*', 'GET', alphaTable);
    await subscriptionsPage.daily.retryAfterError();
    await subscriptionsPage.expectMetrics(['101', '707'], alpha.appName, alpha.productId);
  });

  test('[TC-935] пустой ответ API отображает Daily No data', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('935');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillNextJson('**/api/v1/subscriptions/table*', 'GET', subscriptionTableForApps([]));

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.daily.expectNoData();
  });

  test('[TC-936] карточки Daily metrics доступны через горизонтальный скролл', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('936');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillNextJson('**/api/v1/subscriptions/table*', 'GET', alphaTable);

    await dashboardPage.navigate();
    await subscriptionsPage.setViewport(1280, 720);
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.daily.expectCardsHorizontalScroll();
  });

  test('[TC-937] вертикальный скролл Daily открывает таблицу и пагинацию', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('937');
    const apps = Array.from({ length: 12 }, (_, index): SubscriptionAppOptions => ({
      appId: `vertical-${index + 1}`,
      appName: `Vertical App ${index + 1}`,
      appleId: `${3000000000 + index}`,
      productId: `vertical.app.${index + 1}`,
      totals: [101, 202, 303, 404, 505, 606, 707],
    }));
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillNextJson(
      '**/api/v1/subscriptions/table*',
      'GET',
      subscriptionTableForApps(apps, 12),
    );

    await dashboardPage.navigate();
    await subscriptionsPage.setViewport(1280, 720);
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.daily.expectVerticalScrollAndPagination();
  });

  test('[TC-938] Daily content растягивается на доступную ширину', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('938');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillNextJson('**/api/v1/subscriptions/table*', 'GET', alphaTable);

    await dashboardPage.navigate();
    await subscriptionsPage.setViewport(1280, 720);
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.expandViewportAndExpectDailyContent(1920, 1080);
  });

  test('[TC-930] Dynamics cards, chart и legend соответствуют API', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }, testInfo) => {
    await allure.allureId('930');
    testInfo.snapshotSuffix = '';
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillJsonSequence('**/api/v1/subscriptions/table*', 'GET', [alphaTable, alphaTable]);
    await network.fulfillNextJson('**/api/v1/subscriptions/chart*', 'GET', chart);

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.openDynamics();
    await subscriptionsPage.dynamics.expectMetrics(['101', '707', '5 Aug']);
    await subscriptionsPage.dynamics.expectScreenshot();
  });

  test('[TC-931] Week, Month и 3 months обновляют Dynamics period', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('931');
    await subscriptionsPage.setFixedTime('2026-08-12T05:00:00.000Z');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillJsonSequence(
      '**/api/v1/subscriptions/table*',
      'GET',
      Array.from({ length: 9 }, () => alphaTable),
    );
    await network.fulfillJsonSequence(
      '**/api/v1/subscriptions/chart*',
      'GET',
      Array.from({ length: 8 }, () => chart),
    );

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.openDynamics();
    const urls: string[] = [];
    for (const period of ['month', 'threeMonths'] as const) {
      const updated = await network.waitForResponseWhile(
        { url: '/api/v1/subscriptions/chart', method: 'GET', status: 200 },
        () => subscriptionsPage.dynamics.selectPeriod(period),
      );
      urls.push(decodeURIComponent(updated.response.url()));
    }
    const custom = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/chart', method: 'GET', status: 200 },
      () => subscriptionsPage.dynamics.selectCustomRange(3, 5),
    );
    const customUrl = new URL(custom.response.url());
    await scenarioCheck.equal(
      'Dynamics передаёт from_date',
      customUrl.searchParams.get('from_date'),
      '2026-08-03',
    );
    await scenarioCheck.equal(
      'Dynamics передаёт to_date',
      customUrl.searchParams.get('to_date'),
      '2026-08-05',
    );
    await subscriptionsPage.dynamics.selectPeriod('week');
    await subscriptionsPage.dynamics.expectPeriodInUrl('week');
    await scenarioCheck.equal('Dynamics отправляет два запроса данных', new Set(urls).size, 2);
    await scenarioCheck.isTrue(
      'Оба запроса Dynamics содержат диапазон дат',
      urls.every((url) => url.includes('from_date=') && url.includes('to_date=')),
    );
  });

  test('[TC-932] Indicators filter управляет Dynamics cards, chart и legend', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('932');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillJsonSequence('**/api/v1/subscriptions/table*', 'GET', [
      alphaTable,
      alphaTable,
      alphaTable,
    ]);
    await network.fulfillJsonSequence('**/api/v1/subscriptions/chart*', 'GET', [chart, chart, chart]);

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.openDynamics();
    await subscriptionsPage.dynamics.selectOnlyIndicator('total_revenue', 'Total revenue');
    await subscriptionsPage.dynamics.rejectEmptyIndicatorsAndRestoreAll('total_revenue');
  });

  test('[TC-933] App filter обновляет Dynamics и сохраняет период', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('933');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillJsonSequence(
      '**/api/v1/subscriptions/table*',
      'GET',
      Array.from({ length: 5 }, () => alphaTable),
    );
    await network.fulfillJsonSequence(
      '**/api/v1/subscriptions/chart*',
      'GET',
      Array.from({ length: 5 }, () => chart),
    );

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.openDynamics();
    await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/chart', method: 'GET', status: 200 },
      () => subscriptionsPage.dynamics.selectPeriod('month'),
    );
    const filtered = await network.waitForResponseWhile(
      { url: '/api/v1/subscriptions/chart', method: 'GET', status: 200 },
      () => subscriptionsPage.dynamics.selectApp(alpha.appId, alpha.appName),
    );
    const url = decodeURIComponent(filtered.response.url());
    await scenarioCheck.contains('Dynamics передаёт выбранный App', url, `apphud_app_ids=${alpha.appId}`);
    await scenarioCheck.contains('Dynamics сохраняет from_date', url, 'from_date=');
    await scenarioCheck.contains('Dynamics сохраняет to_date', url, 'to_date=');
    await subscriptionsPage.dynamics.expectPeriodInUrl('month');

    await subscriptionsPage.dynamics.resetAppFilter();
    await subscriptionsPage.dynamics.expectPeriodInUrl('month');
  });

  test('[TC-934] Dynamics system и adaptive states сохраняют доступность контента', async ({
    dashboardPage,
    network,
    subscriptionsPage,
  }) => {
    await allure.allureId('934');
    await network.fulfillNextJson('**/api/v1/subscriptions/filters*', 'GET', filtersResponse);
    await network.fulfillJsonSequence('**/api/v1/subscriptions/table*', 'GET', [alphaTable, alphaTable]);
    await network.failNext('**/api/v1/subscriptions/chart*', 'GET', { message: 'designed failure' });

    await dashboardPage.navigate();
    await subscriptionsPage.openFromStatisticsGroup();
    await subscriptionsPage.setViewport(1280, 720);
    await subscriptionsPage.openDynamicsUntilSystemState();
    await subscriptionsPage.dynamics.expectError();
  });
});
