import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { topKeywordsApi } from '@support/keywords/contracts';

test.describe('Top-3000', () => {
  test('[TC-579] Фильтры обновляют данные раздела', async ({ dashboardPage, topKeywordsPage }) => {
    await allure.allureId('579');
    await dashboardPage.navigate();
    await topKeywordsPage.openFromSidebar();
    await topKeywordsPage.expectFilterControls();

    const initialTable = await topKeywordsPage.tableSnapshot();
    await topKeywordsPage.selectStateAndExpectUpdate('new', initialTable);
    await topKeywordsPage.selectStateAndExpectSnapshot('all', initialTable);
  });

  test('[TC-580] Таблица поддерживает сортировку, пагинацию и открытие строки', async ({
    dashboardPage,
    topKeywordsPage,
  }) => {
    await allure.allureId('580');
    await dashboardPage.navigate();
    await topKeywordsPage.openFromSidebar();
    await topKeywordsPage.expectTableInteractions();
  });

  test('[TC-581] Региональные вкладки Top-3000 переключаются', async ({ dashboardPage, topKeywordsPage }) => {
    await allure.allureId('581');
    await dashboardPage.navigate();
    await topKeywordsPage.openFromSidebar();
    await topKeywordsPage.expectRegionalTabsSwitchable(['usa', 'english', 'europe', 'latin', 'asia']);
  });

  test('[TC-582] Translate all не ломает список ключей', async ({ dashboardPage, topKeywordsPage }) => {
    await allure.allureId('582');
    await dashboardPage.navigate();
    await topKeywordsPage.openFromSidebar();
    await topKeywordsPage.expectTranslateAllRoundTrip();
  });

  test('[TC-668] ошибка API Top-3000 отображается и устраняется повторной загрузкой', async ({
    topKeywordsPage,
    network,
  }) => {
    await allure.allureId('668');
    await network.failNext(topKeywordsApi.groups, 'GET', { message: 'Test failure' });
    await topKeywordsPage.openRoute();
    await topKeywordsPage.overview.expectError();
    await network.reload();
    await topKeywordsPage.overview.expectBusinessControls();
  });

  test('[TC-669] Top-3000 показывает loading state до завершения загрузки', async ({
    topKeywordsPage,
    network,
  }) => {
    await allure.allureId('669');
    const held = await network.holdNext(topKeywordsApi.groups, 'GET');
    const opening = topKeywordsPage.openRoute().catch(() => undefined);
    await held.started;
    await topKeywordsPage.overview.expectLoading();
    await held.abort();
    await opening;
    await network.reload();
    await topKeywordsPage.overview.expectBusinessControls();
  });

  test('[TC-670] Top-3000 показывает empty state и восстанавливает список', async ({
    topKeywordsPage,
    network,
  }) => {
    await allure.allureId('670');
    await network.fulfillNextJson(topKeywordsApi.groups, 'GET', topKeywordsApi.emptyGroups);
    await topKeywordsPage.openRoute();
    await topKeywordsPage.overview.expectEmpty();
    await network.reload();
    await topKeywordsPage.overview.expectBusinessControls();
  });
});
