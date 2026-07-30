import { test, testData } from '@fixtures';
import { allure } from 'allure-playwright';

test.describe('Страница KPI', () => {
  test.beforeEach(async ({ kpiPage }) => {
    await kpiPage.navigate();
  });

  test('Фильтры: отображение, активный таб, переключение и изменение контента', async ({ kpiPage }) => {
    await allure.allureId('811');
    const filters = kpiPage.filters;
    const mainContent = kpiPage.mainContent;

    await test.step('Фильтры отображаются', async () => {
      await filters.verifyVisible();
    });

    await test.step('Активный таб корректен', async () => {
      await filters.verifyActiveTab();
    });

    await test.step('Переключение месяца обновляет контент', async () => {
      await filters.verifyMonthSwitchByIndex(1, mainContent);
    });
  });

  test('Top Employees: подиум отображается полностью и корректно', async ({ kpiPage }) => {
    await allure.allureId('812');
    const top = kpiPage.topEmployees;
    await test.step('Блок отображается', async () => {
      await top.verifyVisible(testData.texts.kpi.basePage.topEmpTitle);
    });
    await test.step('Проверяем полный подиум (3 позиции)', async () => {
      await top.verifyPodium();
    });
  });

  test('Top Employees: претенденты корректны и инициалы совпадают', async ({ kpiPage }) => {
    await allure.allureId('813');
    const top = kpiPage.topEmployees;
    const contendersCount = await top.getContendersCount();
    await test.step(`Проверяем отображение претендентов ${contendersCount} `, async () => {
      await top.verifyContenders();
    });
  });

  test('Карточки KPI отображаются и содержат значения', async ({ kpiPage }) => {
    await allure.allureId('814');
    const { mrrCard, scoreCard, appsCard } = kpiPage.cards;

    await test.step('Total MRR', async () => {
      await mrrCard.assertVisible(testData.texts.kpi.basePage.cardMrrTitle);
    });
    await test.step('Average Score', async () => {
      await scoreCard.assertVisible(testData.texts.kpi.basePage.cardScoreTitle);
    });
    await test.step('Number of Apps', async () => {
      await appsCard.assertVisible(testData.texts.kpi.basePage.cardAppsTitle);
    });
  });

  test('График отображается, табы переключаются без ошибок', async ({ kpiPage, browserDiagnostics }) => {
    await allure.allureId('815');
    const chart = kpiPage.chart;

    await chart.verifyVisible();
    const consoleErrors = browserDiagnostics.captureConsoleErrors('KPI performance chart');
    await chart.selectMrr();
    consoleErrors.expectNoErrors();
    await chart.selectScore();
    consoleErrors.expectNoErrors();
    consoleErrors.stop();
  });

  test('Таблица сотрудников: строки отображаются и корректны', async ({ kpiPage }) => {
    await allure.allureId('817');
    const table = kpiPage.employeesTable;

    await test.step('Таблица отображается', async () => {
      await table.verifyVisible();
    });
  });

  test('Таблица сотрудников: кнопка Open открывает страницу сотрудника', async ({ kpiPage }) => {
    await allure.allureId('816');
    const table = kpiPage.employeesTable;

    await table.expectPopulated();
    await table.openFirstEmployee();
    await kpiPage.expectEmployeeDetailsUrl();
  });

  test('Таблица сотрудников: сортировка по колонкам', async ({ kpiPage }) => {
    await allure.allureId('818');
    const table = kpiPage.employeesTable;

    await test.step('Sort by Score', async () => {
      await table.assertSortedBy('score', 'desc');
      await table.sortBy('Score');
      await table.assertSortedBy('score', 'desc');
      await table.sortBy('Score');
      await table.assertSortedBy('score', 'asc');
      await table.sortBy('Score');
    });

    await test.step('Sort by MRR', async () => {
      await table.sortBy('MRR');
      await table.assertSortedBy('mrr', 'desc');
      await table.sortBy('MRR');
      await table.assertSortedBy('mrr', 'asc');
      await table.sortBy('MRR');
    });
  });
});
