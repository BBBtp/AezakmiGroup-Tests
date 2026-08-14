import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('Top-3000', () => {
  test.beforeEach(async ({ dashboardPage, topKeywordsPage }) => {
    await dashboardPage.navigate();
    await topKeywordsPage.openFromSidebar();
  });

  test('Фильтры обновляют данные раздела', async ({ topKeywordsPage }) => {
    await allure.allureId('579');
    await topKeywordsPage.expectFilterControls();

    const initialTable = await topKeywordsPage.tableSnapshot();
    await topKeywordsPage.selectStateAndExpectUpdate('new', initialTable);
    await topKeywordsPage.selectStateAndExpectSnapshot('all', initialTable);
  });

  test('Таблица поддерживает сортировку, пагинацию и открытие строки', async ({ topKeywordsPage }) => {
    await allure.allureId('580');
    await topKeywordsPage.expectTableInteractions();
  });

  test('Региональные вкладки Top-3000 переключаются', async ({ topKeywordsPage }) => {
    await allure.allureId('581');
    await topKeywordsPage.expectRegionalTabsSwitchable(['usa', 'english', 'europe', 'latin', 'asia']);
  });

  test('Translate all не ломает список ключей', async ({ topKeywordsPage }) => {
    await allure.allureId('582');
    await topKeywordsPage.expectTranslateAllRoundTrip();
  });
});
