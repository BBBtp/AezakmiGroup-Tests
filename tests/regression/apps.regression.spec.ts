import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { appsApi } from '@support/product/contracts';

test.describe('Product / Apps', () => {
  test('раздел открывается из бокового меню и показывает основные контролы', async ({
    dashboardPage,
    productPage,
  }) => {
    await allure.allureId('614');
    await dashboardPage.navigate();
    await productPage.openAppsFromSidebar();
  });

  test('фильтры Day, Week и Month переключают период', async ({ productPage }) => {
    await allure.allureId('615');
    await productPage.openApps();
    await productPage.apps.selectTab('Week');
    await productPage.apps.selectTab('Month');
    await productPage.apps.selectTab('Day');
  });

  test('App list показывает приложения и контекст пагинации', async ({ productPage }) => {
    await allure.allureId('616');
    await productPage.openApps();
    await productPage.apps.selectTab('App list');
    await productPage.apps.expectRows();
    await productPage.apps.expectPaginationContext();
  });

  test('строка приложения открывает detail', async ({ productPage }) => {
    await allure.allureId('617');
    await productPage.openApps();
    await productPage.apps.openFirstApp();
    await productPage.apps.expectDetail();
  });

  test('Detailed statistics доступна для всех периодов и возвращает список', async ({ productPage }) => {
    await allure.allureId('618');
    await productPage.openApps();
    await productPage.apps.selectTab('Detailed statistics');
    await productPage.apps.selectTab('Week');
    await productPage.apps.selectTab('App list');
  });

  test('FilterPopover закрепляет Select all первым при полном и частичном выборе', async ({
    productPage,
  }) => {
    await allure.allureId('991');
    await productPage.openApps();
    await productPage.apps.selectTab('Detailed statistics');
    const details = await productPage.apps.openFirstSuccessRateDetails();
    await details.openGeoFilter();

    await details.selectAllGeos();
    expect((await details.optionOrder())[0]).toBe('select_all');

    await details.selectOnlyGeos(['RU', 'AZ']);
    expect((await details.optionOrder()).slice(0, 5)).toEqual(['select_all', 'RU', 'AZ', 'divider', 'total']);
  });

  test('Archive открывается из списка приложений', async ({ productPage }) => {
    await allure.allureId('619');
    await productPage.openApps();
    await productPage.apps.openArchive();
  });

  test('при загрузке раздел показывает observable loading state', async ({ network, productPage }) => {
    await allure.allureId('721');
    const held = await network.holdNext(appsApi.data, 'GET');
    const opening = productPage.openAppsRoute();
    await held.started;
    await productPage.apps.expectLoading();
    await held.abort();
    await opening;
  });

  test('пустой ответ API скрывает строки без технических значений', async ({ network, productPage }) => {
    await allure.allureId('722');
    await network.mockJson(appsApi.data, 'GET', appsApi.emptyData);
    await productPage.openAppsRoute();
    await productPage.apps.expectEmpty();
  });

  test('ошибка API отображается без устаревших строк', async ({ network, productPage }) => {
    await allure.allureId('719');
    await network.failNext(appsApi.data, 'GET', { message: 'Test failure' });
    await productPage.openAppsRoute();
    await productPage.apps.expectError();
  });

  test('календарный контекст не теряется между периодами', async ({ productPage }) => {
    await allure.allureId('723');
    await productPage.openApps();
    await productPage.apps.selectTab('Month');
    await productPage.apps.selectTab('Day');
    await productPage.apps.expectPaginationContext();
  });

  test('контекст списка сохраняется после detail и возврата', async ({ productPage }) => {
    await allure.allureId('724');
    await productPage.openApps();
    await productPage.apps.selectTab('App list');
    await productPage.apps.openFirstApp();
    await productPage.backToApps();
    await productPage.apps.expectPaginationContext();
  });

  test('прямой URL detail переживает reload и позволяет вернуться', async ({ network, productPage }) => {
    await allure.allureId('725');
    await productPage.openApps();
    await productPage.apps.openFirstApp();
    await network.reload();
    await productPage.apps.expectDetail();
    await productPage.backToApps();
  });
});
