import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('Statistics', () => {
  test.beforeEach(async ({ dashboardPage, statisticsPage }) => {
    await dashboardPage.navigate();
    await statisticsPage.openFromSidebar();
  });

  test('Фильтры обновляют данные раздела и возвращаются к исходному состоянию', async ({
    statisticsPage,
  }) => {
    await allure.allureId('576');
    await statisticsPage.expectFilterControls();
    await statisticsPage.expectPeriodActive('week');

    const initialChart = await statisticsPage.chartSnapshot();
    await statisticsPage.selectPeriodAndExpectUpdate('month', initialChart);
    await statisticsPage.selectPeriodAndExpectSnapshot('week', initialChart);
  });

  test('График статистики обновляется при выборе периода', async ({ statisticsPage }) => {
    await allure.allureId('577');
    await statisticsPage.expectPeriodActive('week');

    const weekChart = await statisticsPage.chartSnapshot();
    const monthChart = await statisticsPage.selectPeriodAndExpectUpdate('month', weekChart);
    const threeMonthsChart = await statisticsPage.selectPeriodAndExpectUpdate('threeMonths', monthChart);
    await statisticsPage.selectPeriodAndExpectUpdate('week', threeMonthsChart);
  });
});
