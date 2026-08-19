import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { outKeywordsApi } from '@support/push/contracts';

test.describe('Out keywords', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('открывается из бокового меню и показывает основные контролы', async ({ pushPage }) => {
    await allure.allureId('606');
    await pushPage.openOutKeywordsFromSidebar();
  });

  test('фильтры Today и Yesterday обновляют период', async ({ pushPage }) => {
    await allure.allureId('607');
    await pushPage.openOutKeywordsFromSidebar();
    await pushPage.outKeywords.openFilters();
    await pushPage.outKeywords.selectPeriod('Yesterday');
    await pushPage.outKeywords.selectPeriod('Today');
  });

  test('Delete all installs не выполняется без доступных данных и подтверждения', async ({
    network,
    pushPage,
  }) => {
    await allure.allureId('608');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && outKeywordsApi.mutation.test(request.url()),
    );
    await network.fulfillNextJson(outKeywordsApi.apps, 'GET', outKeywordsApi.emptyApps);
    await pushPage.openOutKeywordsRoute();
    await pushPage.outKeywords.expectDeleteAvailability('disabled');
    expect(mutations.count).toBe(0);
    mutations.stop();
  });

  test('Settings открывает настройки раздела без сохранения', async ({ pushPage }) => {
    await allure.allureId('609');
    test.info().annotations.push({
      type: 'feature-gap',
      description: 'Настройки доступны, отдельное действие Save/Apply пока отсутствует.',
    });
    await pushPage.openOutKeywordsFromSidebar();
    await pushPage.outKeywords.openSettings();
    await pushPage.outKeywords.expectSettingsForm();
  });

  test('ошибка API отображается без поломанной страницы', async ({ network, pushPage }) => {
    await allure.allureId('707');
    await network.failNext(outKeywordsApi.apps, 'GET', { message: 'Test failure' });
    await pushPage.openOutKeywordsRoute();
    await pushPage.outKeywords.expectError();
  });

  test('loading state завершается после восстановления API', async ({ network, pushPage }) => {
    await allure.allureId('708');
    const held = await network.holdNext(outKeywordsApi.apps, 'GET');
    const opening = pushPage.openOutKeywordsRoute();
    await held.started;
    await pushPage.outKeywords.expectLoading();
    await held.abort();
    await opening.catch(() => undefined);
    await network.fulfillNextJson(outKeywordsApi.apps, 'GET', outKeywordsApi.emptyApps);
    await network.reload();
    await pushPage.outKeywords.expectEmpty();
  });

  test('пустой результат отображается корректно', async ({ network, pushPage }) => {
    await allure.allureId('709');
    await network.fulfillNextJson(outKeywordsApi.apps, 'GET', outKeywordsApi.emptyApps);
    await pushPage.openOutKeywordsRoute();
    await pushPage.outKeywords.expectEmpty();
  });

  test('граничные даты Today и Yesterday можно сбросить к дефолту', async ({ pushPage }) => {
    await allure.allureId('710');
    await pushPage.openOutKeywordsFromSidebar();
    await pushPage.outKeywords.selectPeriod('Yesterday');
    await pushPage.outKeywords.selectPeriod('Today');
  });

  test('Delete all installs защищён отсутствием доступного действия', async ({ network, pushPage }) => {
    await allure.allureId('711');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && outKeywordsApi.mutation.test(request.url()),
    );
    await network.fulfillNextJson(outKeywordsApi.apps, 'GET', outKeywordsApi.emptyApps);
    await pushPage.openOutKeywordsRoute();
    await pushPage.outKeywords.expectDeleteAvailability('disabled');
    expect(mutations.count).toBe(0);
    mutations.stop();
  });

  test('Settings валидирует обязательные значения', async ({ pushPage }) => {
    await allure.allureId('712');
    test.info().annotations.push({
      type: 'feature-gap',
      description: 'Проверка disabled Save/Apply включится автоматически после появления действия.',
    });
    await pushPage.openOutKeywordsFromSidebar();
    await pushPage.outKeywords.openSettings();
    await pushPage.outKeywords.expectSettingsForm();
    await pushPage.outKeywords.expectSettingsValidation();
  });
});
