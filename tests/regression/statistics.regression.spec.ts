import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { statisticsApi } from '@support/statistics/contracts';

test.describe('Statistics', () => {
  test('[TC-576] Фильтры обновляют данные раздела и возвращаются к исходному состоянию', async ({
    dashboardPage,
    statisticsPage,
  }) => {
    await allure.allureId('576');
    await dashboardPage.navigate();
    await statisticsPage.openFromSidebar();
    await statisticsPage.expectFilterControls();
    await statisticsPage.expectPeriodActive('week');

    const initialChart = await statisticsPage.chartSnapshot();
    await statisticsPage.selectPeriodAndExpectUpdate('month', initialChart);
    await statisticsPage.selectPeriodAndExpectSnapshot('week', initialChart);
  });

  test('[TC-577] График статистики обновляется при выборе периода', async ({
    dashboardPage,
    statisticsPage,
  }) => {
    await allure.allureId('577');
    await dashboardPage.navigate();
    await statisticsPage.openFromSidebar();
    await statisticsPage.expectPeriodActive('week');

    const weekChart = await statisticsPage.chartSnapshot();
    const monthChart = await statisticsPage.selectPeriodAndExpectUpdate('month', weekChart);
    const threeMonthsChart = await statisticsPage.selectPeriodAndExpectUpdate('threeMonths', monthChart);
    await statisticsPage.selectPeriodAndExpectUpdate('week', threeMonthsChart);
  });

  test('[TC-664] ошибка API Statistics отображается и устраняется повторной загрузкой', async ({
    statisticsPage,
    network,
  }) => {
    await allure.allureId('664');
    await network.failNext(statisticsApi.chart, 'GET', { message: 'Test failure' });
    await statisticsPage.openRoute();
    await statisticsPage.overview.expectError();
    await network.reload();
    await statisticsPage.overview.expectBusinessControls();
  });

  test('[TC-665] Statistics показывает loading state до завершения загрузки', async ({
    statisticsPage,
    network,
  }) => {
    await allure.allureId('665');
    const held = await network.holdNext(statisticsApi.chart, 'GET');
    const opening = statisticsPage.openRoute().catch(() => undefined);
    await held.started;
    await statisticsPage.overview.expectLoading();
    await held.abort();
    await opening;
    await network.reload();
    await statisticsPage.overview.expectBusinessControls();
  });

  test('[TC-666] Statistics корректно отображает пустые метрики и восстанавливает данные', async ({
    statisticsPage,
    network,
  }) => {
    await allure.allureId('666');
    await network.fulfillNextJson(statisticsApi.chart, 'GET', statisticsApi.emptyChart);
    await statisticsPage.openRoute();
    await statisticsPage.overview.expectEmpty();
    await network.reload();
    await statisticsPage.overview.expectBusinessControls();
  });
});
