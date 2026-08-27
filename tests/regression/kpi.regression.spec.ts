import { test, testData } from '@fixtures';
import { allure } from 'allure-playwright';
import {
  assessKpiDataset,
  hasKpiData,
  kpiDataUnavailableMessage,
  openKpiAndGetStatistics,
  type KpiDataRequirement,
} from '@support/kpi';

async function skipWithoutKpiData(
  requirement: KpiDataRequirement,
  kpiPage: Parameters<typeof openKpiAndGetStatistics>[0],
  network: Parameters<typeof openKpiAndGetStatistics>[1],
): Promise<void> {
  const dataset = assessKpiDataset(await openKpiAndGetStatistics(kpiPage, network));
  test.skip(!hasKpiData(dataset, requirement), kpiDataUnavailableMessage(dataset, requirement));
}

test.describe('Страница KPI', () => {
  test('[TC-811] Фильтры: отображение, активный таб, переключение и изменение контента', async ({
    kpiPage,
  }) => {
    await allure.allureId('811');
    await kpiPage.navigate();
    const filters = kpiPage.filters;
    const mainContent = kpiPage.mainContent;

    await test.step('ПРОВЕРКА · Фильтры периода отображаются', async () => {
      await filters.verifyVisible();
    });

    await test.step('ПРОВЕРКА · Активный период соответствует текущему месяцу', async () => {
      await filters.verifyActiveTab();
    });

    await test.step('ДЕЙСТВИЕ · Переключить месяц и проверить обновление контента', async () => {
      await filters.verifyMonthSwitchByIndex(1, mainContent);
    });
  });

  test('[TC-812] Top Employees: подиум отображается полностью и корректно', async ({ kpiPage, network }) => {
    await allure.allureId('812');
    await skipWithoutKpiData('podium', kpiPage, network);
    const top = kpiPage.topEmployees;
    await test.step('ПРОВЕРКА · Блок Top employees отображается', async () => {
      await top.verifyVisible(testData.texts.kpi.basePage.topEmpTitle);
    });
    await test.step('ПРОВЕРКА · Полный подиум содержит три позиции', async () => {
      await top.verifyPodium();
    });
  });

  test('[TC-813] Top Employees: претенденты корректны и инициалы совпадают', async ({ kpiPage, network }) => {
    await allure.allureId('813');
    await skipWithoutKpiData('contenders', kpiPage, network);
    const top = kpiPage.topEmployees;
    const contendersCount = await top.getContendersCount();
    await test.step(`ПРОВЕРКА · Отображаются претенденты: ${contendersCount}`, async () => {
      await top.verifyContenders();
    });
  });

  test('[TC-814] Карточки KPI отображаются и содержат значения', async ({ kpiPage }) => {
    await allure.allureId('814');
    await kpiPage.navigate();
    const { mrrCard, scoreCard, appsCard } = kpiPage.cards;

    await test.step('ПРОВЕРКА · Карточка Total MRR', async () => {
      await mrrCard.assertVisible(testData.texts.kpi.basePage.cardMrrTitle);
    });
    await test.step('ПРОВЕРКА · Карточка Average Score', async () => {
      await scoreCard.assertVisible(testData.texts.kpi.basePage.cardScoreTitle);
    });
    await test.step('ПРОВЕРКА · Карточка Number of Apps', async () => {
      await appsCard.assertVisible(testData.texts.kpi.basePage.cardAppsTitle);
    });
  });

  test('[TC-815] График отображается, табы переключаются без ошибок', async ({
    kpiPage,
    browserDiagnostics,
  }) => {
    await allure.allureId('815');
    await kpiPage.navigate();
    const chart = kpiPage.chart;

    await chart.verifyVisible();
    const consoleErrors = browserDiagnostics.captureConsoleErrors('KPI performance chart');
    await chart.selectMrr();
    consoleErrors.expectNoErrors();
    await chart.selectScore();
    consoleErrors.expectNoErrors();
    consoleErrors.stop();
  });

  test('[TC-817] Таблица сотрудников: строки отображаются и корректны', async ({ kpiPage, network }) => {
    await allure.allureId('817');
    await skipWithoutKpiData('manager', kpiPage, network);
    const table = kpiPage.employeesTable;

    await test.step('ПРОВЕРКА · Таблица сотрудников отображается', async () => {
      await table.verifyVisible();
    });
  });

  test('[TC-816] Таблица сотрудников: кнопка Open открывает страницу сотрудника', async ({
    kpiPage,
    network,
  }) => {
    await allure.allureId('816');
    await skipWithoutKpiData('manager', kpiPage, network);
    const table = kpiPage.employeesTable;

    await table.expectPopulated();
    await table.openFirstEmployee();
    await kpiPage.expectEmployeeDetailsUrl();
  });

  test('[TC-818] Таблица сотрудников: сортировка по колонкам', async ({ kpiPage, network }) => {
    await allure.allureId('818');
    await skipWithoutKpiData('manager', kpiPage, network);
    const table = kpiPage.employeesTable;

    await test.step('ДЕЙСТВИЕ · Отсортировать таблицу по Score', async () => {
      await table.assertSortedBy('score', 'desc');
      await table.sortBy('Score');
      await table.assertSortedBy('score', 'desc');
      await table.sortBy('Score');
      await table.assertSortedBy('score', 'asc');
      await table.sortBy('Score');
    });

    await test.step('ДЕЙСТВИЕ · Отсортировать таблицу по MRR', async () => {
      await table.sortBy('MRR');
      await table.assertSortedBy('mrr', 'desc');
      await table.sortBy('MRR');
      await table.assertSortedBy('mrr', 'asc');
      await table.sortBy('MRR');
    });
  });
});
