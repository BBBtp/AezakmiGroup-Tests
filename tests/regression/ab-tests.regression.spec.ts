import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { abTestsApi } from '@support/product/contracts';

test.describe('Product / A/B tests', () => {
  test('фильтры Team, App и Test type доступны', async ({ productPage }) => {
    await allure.allureId('621');
    await productPage.openAbTests();
    await productPage.abTests.openFilter('Team');
    await productPage.abTests.openFilter('App');
    await productPage.abTests.openFilter('Test type');
  });

  test('список тестов показывает приложения и пагинацию', async ({ productPage }) => {
    await allure.allureId('622');
    await productPage.openAbTests();
    await productPage.abTests.expectRowsAndPagination();
  });

  test('Create test открывает форму без преждевременной мутации', async ({ network, productPage }) => {
    await allure.allureId('623');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes('/ab-tests'),
    );
    await productPage.openAbTests();
    await productPage.abTests.openCreate();
    expect(mutations.count).toBe(0);
    mutations.stop();
  });

  test('ссылка приложения из A/B test открывает соответствующий detail', async ({ productPage }) => {
    await allure.allureId('624');
    await productPage.openAbTests();
    await productPage.abTests.openFirstApplication();
  });

  test('фильтр Team: Our tests сохраняется после возврата', async ({ productPage }) => {
    await allure.allureId('625');
    await productPage.openAbTests();
    await productPage.abTests.expectTeamFilter();
    await productPage.abTests.openFirstApplication();
    await productPage.backToAbTests();
    await productPage.abTests.expectTeamFilter();
  });

  test('ошибка API отображается без устаревших строк', async ({ network, productPage }) => {
    await allure.allureId('727');
    await network.failNext(abTestsApi.list, 'GET', { message: 'Test failure' });
    await productPage.openAbTestsRoute();
    await productPage.abTests.expectError();
  });

  test('загрузочный state виден до ответа API', async ({ network, productPage }) => {
    await allure.allureId('728');
    const held = await network.holdNext(abTestsApi.list, 'GET');
    const opening = productPage.openAbTestsRoute();
    await held.started;
    await productPage.abTests.expectLoading();
    await held.abort();
    await opening;
  });

  test('пустой ответ API скрывает строки без технических значений', async ({ network, productPage }) => {
    await allure.allureId('729');
    await network.mockJson(abTestsApi.list, 'GET', abTestsApi.emptyList);
    await productPage.openAbTestsRoute();
    await productPage.abTests.expectEmpty();
  });

  test('пагинация сохраняет выбранный Team-контекст', async ({ productPage }) => {
    await allure.allureId('730');
    await productPage.openAbTests();
    await productPage.abTests.expectRowsAndPagination();
    await productPage.abTests.expectTeamFilter();
  });

  test('Create test не сохраняет пустой черновик', async ({ network, productPage }) => {
    await allure.allureId('731');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes('/ab-tests'),
    );
    await productPage.openAbTests();
    await productPage.abTests.openCreate();
    expect(mutations.count).toBe(0);
    mutations.stop();
  });

  test('отмена Create test возвращает список без сохранения', async ({ network, productPage }) => {
    await allure.allureId('732');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes('/ab-tests'),
    );
    await productPage.openAbTests();
    await productPage.abTests.openCreate();
    await productPage.backToAbTests();
    expect(mutations.count).toBe(0);
    mutations.stop();
  });
});
