import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { outKeywordsApi } from '@support/push/contracts';

test.describe('Out keywords', () => {
  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('[TC-606] открывается из бокового меню и показывает основные контролы', async ({ pushPage }) => {
    await allure.allureId('606');
    await pushPage.openOutKeywordsFromSidebar();
  });

  test('[TC-607] фильтры Today и Yesterday обновляют период', async ({ pushPage }) => {
    await allure.allureId('607');
    await pushPage.openOutKeywordsFromSidebar();
    await pushPage.outKeywords.openFilters();
    await pushPage.outKeywords.selectPeriod('Yesterday');
    await pushPage.outKeywords.selectPeriod('Today');
  });

  test('[TC-608] Delete all installs не выполняется без доступных данных и подтверждения', async ({
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
    await mutations.expectCount(0, 'Недоступное Delete all installs не отправляет мутацию');
    mutations.stop();
  });

  test('[TC-609] Settings открывает настройки раздела без сохранения', async ({ pushPage }) => {
    await allure.allureId('609');
    test.info().annotations.push({
      type: 'feature-gap',
      description: 'Настройки доступны, отдельное действие Save/Apply пока отсутствует.',
    });
    await pushPage.openOutKeywordsFromSidebar();
    await pushPage.outKeywords.openSettings();
    await pushPage.outKeywords.expectSettingsForm();
  });

  test('[TC-707] ошибка API отображается без поломанной страницы', async ({ network, pushPage }) => {
    await allure.allureId('707');
    await network.failNext(outKeywordsApi.apps, 'GET', { message: 'Test failure' });
    await pushPage.openOutKeywordsRoute();
    await pushPage.outKeywords.expectError();
  });

  test('[TC-708] loading state завершается после восстановления API', async ({ network, pushPage }) => {
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

  test('[TC-709] пустой результат отображается корректно', async ({ network, pushPage }) => {
    await allure.allureId('709');
    await network.fulfillNextJson(outKeywordsApi.apps, 'GET', outKeywordsApi.emptyApps);
    await pushPage.openOutKeywordsRoute();
    await pushPage.outKeywords.expectEmpty();
  });

  test('[TC-710] граничные даты Today и Yesterday можно сбросить к дефолту', async ({ pushPage }) => {
    await allure.allureId('710');
    await pushPage.openOutKeywordsFromSidebar();
    await pushPage.outKeywords.selectPeriod('Yesterday');
    await pushPage.outKeywords.selectPeriod('Today');
  });

  test('[TC-711] Delete all installs защищён отсутствием доступного действия', async ({
    network,
    pushPage,
  }) => {
    await allure.allureId('711');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && outKeywordsApi.mutation.test(request.url()),
    );
    await network.fulfillNextJson(outKeywordsApi.apps, 'GET', outKeywordsApi.emptyApps);
    await pushPage.openOutKeywordsRoute();
    await pushPage.outKeywords.expectDeleteAvailability('disabled');
    await mutations.expectCount(0, 'Защищённое Delete all installs не отправляет мутацию');
    mutations.stop();
  });

  test('[TC-712] Settings валидирует обязательные значения', async ({ pushPage }) => {
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
