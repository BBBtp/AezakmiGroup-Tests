import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { suggestsApi } from '@support/suggests/contracts';

test.describe('Suggests', () => {
  test('ошибка API Suggests отображается и устраняется повторной загрузкой', async ({
    suggestsPage,
    network,
  }) => {
    await allure.allureId('675');
    await network.failNext(suggestsApi.list, 'GET', { message: 'Test failure' });
    await suggestsPage.openRoute();
    await suggestsPage.overview.expectError();
    await network.reload();
    await suggestsPage.overview.expectBusinessControls();
  });

  test('Suggests показывает loading state до завершения загрузки', async ({ suggestsPage, network }) => {
    await allure.allureId('676');
    const held = await network.holdNext(suggestsApi.list, 'GET');
    const opening = suggestsPage.openRoute().catch(() => undefined);
    await held.started;
    await suggestsPage.overview.expectLoading();
    await held.abort();
    await opening;
    await network.reload();
    await suggestsPage.overview.expectBusinessControls();
  });

  test('Suggests показывает empty state и восстанавливает список', async ({ suggestsPage, network }) => {
    await allure.allureId('677');
    await network.fulfillNextJson(suggestsApi.list, 'GET', suggestsApi.emptyList);
    await suggestsPage.openRoute();
    await suggestsPage.overview.expectEmpty();
    await network.reload();
    await suggestsPage.overview.expectBusinessControls();
  });
});
