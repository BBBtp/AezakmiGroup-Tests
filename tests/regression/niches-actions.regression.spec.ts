import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import { activeNiches, apiError } from '@support/niches';

const refreshEndpoint = '/master/api/v1/apps/parsed/aso-mobile';
const refreshRoute = '**/master/api/v1/apps/parsed/aso-mobile';
const nicheMutationRoute = /\/master\/api\/v1\/niches\/[^/?]+(?:\?.*)?$/;
const activeNichesEndpoint = /\/api\/v1\/niches\?archive=false$/;

test.describe('Niches → data actions', () => {
  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('[TC-596] отменяет Refresh new и подтверждает Refresh all', async ({ network, nichesPage }) => {
    await allure.allureId('596');
    await nichesPage.openSortedAppsFromSidebar();
    const refreshRequests = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes(refreshEndpoint),
    );

    await nichesPage.sortedApps.openRefresh('new');
    await nichesPage.sortedApps.cancelRefresh();
    await refreshRequests.expectCount(0, 'Отмена Refresh new не отправляет запрос');

    await network.fulfillNextJson(refreshRoute, 'PUT', {}, 200);
    await nichesPage.sortedApps.openRefresh('all');
    const { response } = await network.waitForResponseWhile(
      { url: refreshEndpoint, method: 'PUT', status: 200 },
      () => nichesPage.sortedApps.confirmRefresh(),
    );

    await scenarioCheck.equal('Refresh all отправляет PUT-запрос', response.request().method(), 'PUT');
    await scenarioCheck.isNull('Refresh all отправляется без тела', response.request().postData());
    await refreshRequests.expectCount(1, 'Refresh all отправляет ровно один запрос');
    refreshRequests.stop();
    await network.reload();
    await nichesPage.sortedApps.expectBusinessControls();
  });

  test('[TC-598] добавляет уникальный keyword в выбранный GEO', async ({
    dataFactory,
    network,
    nichesPage,
  }) => {
    await allure.allureId('598');
    await nichesPage.openFromSidebar();
    await nichesPage.openFirstDetail();
    const keyword = dataFactory.uniqueLabel('automation').toLowerCase();

    await nichesPage.detail.openAddKeywords();
    await nichesPage.detail.fillManualKeyword('US', keyword);
    await network.fulfillNextMutation(nicheMutationRoute, {}, 200);
    const { response } = await network.waitForResponseWhile(
      { url: nicheMutationRoute, method: 'PATCH', status: 200 },
      () => nichesPage.detail.submitKeyword(),
    );

    await scenarioCheck.deepEqual(
      'PATCH содержит новый keyword для GEO US',
      response.request().postDataJSON(),
      {
        keywords_to_create: [{ country: 'US', keyword }],
      },
    );
    await nichesPage.expectNotice('Keywords have been successfully added');
    await nichesPage.detail.expectAddKeywordsClosed();
  });

  test('[TC-690] восстанавливает список после ошибки API', async ({ network, nichesPage }) => {
    await allure.allureId('690');
    await network.failNext(activeNichesEndpoint, 'GET', apiError, 500);
    await nichesPage.navigateToList();
    await nichesPage.expectListError();

    await network.fulfillNextJson(activeNichesEndpoint, 'GET', activeNiches(2));
    await nichesPage.repeatListRequest();
    await nichesPage.overview.expectBusinessControls();
    await nichesPage.overview.expectListRows(2);
  });

  test('[TC-691] завершает повторное состояние медленной загрузки', async ({ network, nichesPage }) => {
    await allure.allureId('691');
    const firstRequest = await network.holdNextJson(activeNichesEndpoint, 'GET');
    const opening = nichesPage.navigateToList();
    await firstRequest.started;
    await nichesPage.expectListLoading();
    await firstRequest.fulfill(activeNiches(2));
    await opening;
    await nichesPage.overview.expectBusinessControls();

    const secondRequest = await network.holdNextJson(activeNichesEndpoint, 'GET');
    const reloading = network.reload();
    await secondRequest.started;
    await nichesPage.expectListLoading();
    await secondRequest.fulfill(activeNiches(2));
    await reloading;
    await nichesPage.overview.expectBusinessControls();
  });

  test('[TC-692] показывает empty state и возвращает список после сброса поиска', async ({ nichesPage }) => {
    await allure.allureId('692');
    await nichesPage.openFromSidebar();
    await nichesPage.overview.expectListRows();

    await nichesPage.overview.searchFor('missing-niche-automation');
    await nichesPage.overview.expectEmpty(/No niches|Nothing was found/i);
    await nichesPage.overview.searchFor('');
    await nichesPage.overview.expectListRows();
  });
});
