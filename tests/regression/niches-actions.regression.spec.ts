import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { activeNiches, apiError } from '@support/niches';

const refreshEndpoint = '/master/api/v1/apps/parsed/aso-mobile';
const refreshRoute = '**/master/api/v1/apps/parsed/aso-mobile';
const nicheMutationRoute = /\/master\/api\/v1\/niches\/[^/?]+(?:\?.*)?$/;
const activeNichesEndpoint = /\/api\/v1\/niches\?archive=false$/;

test.describe('Niches → data actions', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('отменяет Refresh new и подтверждает Refresh all', async ({ network, nichesPage }) => {
    await allure.allureId('596');
    await nichesPage.openSortedAppsFromSidebar();
    const refreshRequests = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes(refreshEndpoint),
    );

    await nichesPage.sortedApps.openRefresh('new');
    await nichesPage.sortedApps.cancelRefresh();
    expect(refreshRequests.count).toBe(0);

    await network.fulfillNextJson(refreshRoute, 'PUT', {}, 200);
    await nichesPage.sortedApps.openRefresh('all');
    const { response } = await network.waitForResponseWhile(
      { url: refreshEndpoint, method: 'PUT', status: 200 },
      () => nichesPage.sortedApps.confirmRefresh(),
    );

    expect(response.request().method()).toBe('PUT');
    expect(response.request().postData()).toBeNull();
    expect(refreshRequests.count).toBe(1);
    refreshRequests.stop();
    await network.reload();
    await nichesPage.sortedApps.expectBusinessControls();
  });

  test('добавляет уникальный keyword в выбранный GEO', async ({ network, nichesPage }) => {
    await allure.allureId('598');
    await nichesPage.openFromSidebar();
    await nichesPage.openFirstDetail();
    const keyword = `automation-${Date.now()}`;

    await nichesPage.detail.openAddKeywords();
    await nichesPage.detail.fillManualKeyword('US', keyword);
    await network.fulfillNextMutation(nicheMutationRoute, {}, 200);
    const { response } = await network.waitForResponseWhile(
      { url: nicheMutationRoute, method: 'PATCH', status: 200 },
      () => nichesPage.detail.submitKeyword(),
    );

    expect(response.request().postDataJSON()).toEqual({
      keywords_to_create: [{ country: 'US', keyword }],
    });
    await nichesPage.expectNotice('Keywords have been successfully added');
    await nichesPage.detail.expectAddKeywordsClosed();
  });

  test('восстанавливает список после ошибки API', async ({ network, nichesPage }) => {
    await allure.allureId('690');
    await network.failNext(activeNichesEndpoint, 'GET', apiError, 500);
    await nichesPage.navigateToList();
    await nichesPage.expectListError();

    await network.fulfillNextJson(activeNichesEndpoint, 'GET', activeNiches(2));
    await nichesPage.repeatListRequest();
    await nichesPage.overview.expectBusinessControls();
    await nichesPage.overview.expectListRows(2);
  });

  test('завершает повторное состояние медленной загрузки', async ({ network, nichesPage }) => {
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

  test('показывает empty state и возвращает список после сброса поиска', async ({ nichesPage }) => {
    await allure.allureId('692');
    await nichesPage.openFromSidebar();
    await nichesPage.overview.expectListRows();

    await nichesPage.overview.searchFor('missing-niche-automation');
    await nichesPage.overview.expectEmpty(/No niches|Nothing was found/i);
    await nichesPage.overview.searchFor('');
    await nichesPage.overview.expectListRows();
  });
});
