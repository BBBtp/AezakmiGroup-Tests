import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { pushBotsApi } from '@support/push/contracts';

test.describe('Push bots', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('открывается из бокового меню и показывает основные контролы', async ({ pushPage }) => {
    await allure.allureId('600');
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.expectPeriodControls();
  });

  test('фильтры периода обновляют раздел и сбрасываются в All', async ({ pushPage }) => {
    await allure.allureId('601');
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.openFilters();
    await pushPage.bots.selectPeriod(-1);
    await pushPage.bots.selectAllPeriod();
  });

  test('список открывает выбранную кампанию и возвращает контекст', async ({ pushPage }) => {
    await allure.allureId('602');
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.expectBusinessRows();
    await pushPage.bots.openFirstDetails();
    await pushPage.bots.expectDetailLoaded();
    await pushPage.goBackToBots();
  });

  test('Create push открывает форму подтверждаемого действия', async ({ pushPage }) => {
    await allure.allureId('603');
    test.info().annotations.push({
      type: 'feature-gap',
      description: 'Маршрут Create push доступен, форма пока не реализована в продукте.',
    });
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.openCreate();
    await pushPage.bots.expectCreateEntryState();
  });

  test('detail page соответствует выбранной кампании', async ({ pushPage }) => {
    await allure.allureId('604');
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.openFirstDetails();
    await pushPage.bots.expectDetailLoaded();
  });

  test('Stop push требует подтверждения и допускает отмену', async ({ network, pushPage }) => {
    await allure.allureId('605');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && pushBotsApi.mutation.test(request.url()),
    );
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.openFirstDetails();
    await pushPage.bots.openStopConfirmation();
    await pushPage.bots.cancelStop();
    expect(mutations.count).toBe(0);
    mutations.stop();
  });

  test('ошибка API отображается без устаревших данных', async ({ network, pushPage }) => {
    await allure.allureId('699');
    await network.failNext(pushBotsApi.campaigns, 'GET', { message: 'Test failure' });
    await pushPage.openBotsRoute();
    await pushPage.bots.expectError();
  });

  test('загрузочное состояние завершается после ответа API', async ({ network, pushPage }) => {
    await allure.allureId('700');
    const held = await network.holdNext(pushBotsApi.campaigns, 'GET');
    const opening = pushPage.openBotsRoute();
    await held.started;
    await pushPage.bots.expectLoading();
    await held.abort();
    await opening.catch(() => undefined);
    await network.fulfillNextJson(pushBotsApi.campaigns, 'GET', pushBotsApi.emptyCampaigns);
    await network.reload();
    await pushPage.bots.expectLoaded();
  });

  test('пустой ответ API отображается без технических значений', async ({ network, pushPage }) => {
    await allure.allureId('701');
    await network.fulfillNextJson(pushBotsApi.campaigns, 'GET', pushBotsApi.emptyCampaigns);
    await pushPage.openBotsRoute();
    await pushPage.bots.expectEmpty();
  });

  test('контекст периода сохраняется при открытии detail и возврате', async ({ pushPage }) => {
    await allure.allureId('702');
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.selectPeriod(0);
    await pushPage.bots.openFirstDetails();
    await pushPage.goBackToBots();
    await pushPage.bots.expectPeriodControls();
  });

  test('Create push не выполняет мутацию до появления формы', async ({ network, pushPage }) => {
    await allure.allureId('703');
    test.info().annotations.push({
      type: 'feature-gap',
      description: 'Проверка полей будет расширена после реализации формы Create push.',
    });
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && pushBotsApi.mutation.test(request.url()),
    );
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.openCreate();
    await pushPage.bots.expectCreateEntryState();
    expect(mutations.count).toBe(0);
    mutations.stop();
  });

  test('отмена Create push возвращает в список без сохранения', async ({ network, pushPage }) => {
    await allure.allureId('704');
    test.info().annotations.push({
      type: 'feature-gap',
      description: 'Проверка очистки полей будет расширена после реализации формы Create push.',
    });
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && pushBotsApi.mutation.test(request.url()),
    );
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.openCreate();
    await pushPage.cancelCreate();
    expect(mutations.count).toBe(0);
    mutations.stop();
  });

  test('опасное действие Stop push недоступно без подтверждения', async ({ network, pushPage }) => {
    await allure.allureId('705');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && pushBotsApi.mutation.test(request.url()),
    );
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.openFirstDetails();
    await pushPage.bots.openStopConfirmation();
    await pushPage.bots.cancelStop();
    expect(mutations.count).toBe(0);
    mutations.stop();
  });

  test('валидный прямой URL detail повторно загружает кампанию', async ({ network, pushPage }) => {
    await allure.allureId('706');
    await pushPage.openBotsFromSidebar();
    await pushPage.bots.openFirstDetails();
    const response = network.waitForSuccessfulResponse(/\/master\/api\/v1\/push\//, 'GET');
    await network.reload();
    await response;
    await pushPage.bots.expectDetailLoaded();
  });
});
