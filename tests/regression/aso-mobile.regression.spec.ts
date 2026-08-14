import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import {
  asoMobileFixture,
  asoMobileNicheDataResponse,
  asoMobileNichesResponse,
  asoMobileSseError,
} from '@support/niches/aso-mobile-contracts';

const sseEndpoint = '/api/v1/apps/aso-mobile/add';
const sseRoute = '**/api/v1/apps/aso-mobile/add';

test.describe('Niches → Create app in ASO Mobile', () => {
  test.beforeEach(async ({ dashboardPage, network, nichesPage }) => {
    await network.fulfillNextJson(/\/api\/v1\/niches(?:\?.*)?$/, 'GET', asoMobileNichesResponse);
    await network.fulfillNextJson(
      /\/api\/v1\/niches\/front-136-niche\/data(?:\?.*)?$/,
      'GET',
      asoMobileNicheDataResponse,
    );
    await dashboardPage.navigate();
    await nichesPage.openSortedAppsFromSidebar();
    await nichesPage.openAsoMobileCreate();
    await nichesPage.asoMobileCreate.fillValidForm({
      url: asoMobileFixture.appStoreUrl,
      niche: asoMobileFixture.nicheName,
      geo: asoMobileFixture.geo,
    });
  });

  test('успешно завершает создание по SSE result', async ({ network, nichesPage }) => {
    await allure.allureId('920');
    const create = nichesPage.asoMobileCreate;
    const requests = network.captureRequests(
      (request) => request.method() === 'POST' && request.url().includes(sseEndpoint),
    );
    await network.fulfillNextSse(sseRoute, 'POST', 'result', asoMobileFixture.createdApp);

    const { response } = await network.waitForResponseWhile(
      { url: sseEndpoint, method: 'POST', status: 200 },
      () => create.submit(),
    );

    expect(response.headers()['content-type']).toContain('text/event-stream');
    expect(response.request().headers().accept).toContain('text/event-stream');
    expect(response.request().postDataJSON()).toEqual({
      url: asoMobileFixture.appStoreUrl,
      keywords: { US: ['front 136 automation'] },
    });
    await create.expectSuccess();
    expect(requests.urls).toHaveLength(1);
    requests.stop();
  });

  test('закрытие модалки отменяет активное SSE-соединение', async ({ network, nichesPage }) => {
    await allure.allureId('921');
    const create = nichesPage.asoMobileCreate;
    const requests = network.captureRequests(
      (request) => request.method() === 'POST' && request.url().includes(sseEndpoint),
    );
    const held = await network.holdNext(sseRoute, 'POST');

    await create.submit();
    const startedRequest = await held.started;
    expect(startedRequest.headers().accept).toContain('text/event-stream');
    await create.expectSubmitting();
    await network.waitForRequestFailedWhile({ url: sseEndpoint, method: 'POST' }, () => create.close());
    await held.abort();

    expect(requests.urls).toHaveLength(1);
    requests.stop();
    await create.open();
  });

  test('SSE error возвращает управляемую форму без вечного loader', async ({ network, nichesPage }) => {
    await allure.allureId('922');
    const create = nichesPage.asoMobileCreate;
    await network.fulfillNextSse(sseRoute, 'POST', 'error', asoMobileSseError);

    await create.submit();
    await create.expectError();
    await create.close();
    await create.open();
  });
});
