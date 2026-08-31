import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import { checksApi } from '@support/checks';

test.describe('Checks', () => {
  test('[TC-587] фильтры состояния и периода обновляют запрос и сбрасываются', async ({
    checksPage,
    network,
  }) => {
    await allure.allureId('587');
    await checksPage.navigate();
    const returned = await network.waitForRequestWhile({ url: checksApi.data, method: 'GET' }, () =>
      checksPage.overview.selectState('returned'),
    );
    await scenarioCheck.isTrue(
      'Запрос содержит state=returned',
      returned.request.url().includes('state=returned'),
    );
    await checksPage.overview.selectState('all');
    await checksPage.overview.selectDatePeriod('yesterday');
    await checksPage.overview.selectDatePeriod('today');
  });

  test('[TC-681] ошибка API сохраняет целый каркас без частичных данных', async ({ checksPage, network }) => {
    await allure.allureId('681');
    await network.failNext(checksApi.data, 'GET', { detail: 'controlled failure' });
    await checksPage.navigateWithoutContentWait();
    await checksPage.overview.expectStableFallback();
  });

  test('[TC-682] загрузка Checks завершается после ответа API', async ({ checksPage, network }) => {
    await allure.allureId('682');
    const held = await network.holdNextJson(checksApi.data, 'GET');
    const opening = checksPage.navigateWithoutContentWait();
    await held.started;
    await held.fulfill(checksApi.empty);
    await opening;
    await checksPage.overview.expectEmptyState();
  });

  test('[TC-683] пустой результат отображается без технических значений', async ({ checksPage, network }) => {
    await allure.allureId('683');
    await network.fulfillNextJson(checksApi.data, 'GET', checksApi.empty);
    await checksPage.navigateWithoutContentWait();
    await checksPage.overview.expectEmptyState();
  });

  test('[TC-684] date picker показывает корректное граничное состояние сброса', async ({ checksPage }) => {
    await allure.allureId('684');
    await checksPage.navigate();
    await checksPage.overview.expectDatePickerBoundaryState();
  });

  test('[TC-685] смена состояния сохраняет контекст даты в запросе', async ({ checksPage, network }) => {
    await allure.allureId('685');
    await checksPage.navigate();
    const changed = await network.waitForRequestWhile({ url: checksApi.data, method: 'GET' }, () =>
      checksPage.overview.selectState('returned'),
    );
    await scenarioCheck.isTrue(
      'Запрос сохраняет выбранную дату',
      changed.request.url().includes('for_date='),
    );
    await scenarioCheck.isTrue(
      'Запрос сохраняет контекст активных checks',
      changed.request.url().includes('active_checks=true'),
    );
  });

  test('[TC-686] regular user не получает опасные действия Checks', async ({
    applicationShell,
    checksPage,
    loginPage,
    regularUser,
  }) => {
    await allure.allureId('686');
    await checksPage.navigate();
    await applicationShell.logout();
    await loginPage.login(regularUser.email, regularUser.password);
    await loginPage.expectAuthenticated();
    await checksPage.expectAccessBlocked();
  });

  test('[TC-687] Edit keywords блокирует пустые и невалидные значения', async ({ checksPage }) => {
    await allure.allureId('687');
    await checksPage.navigate();
    const modal = await checksPage.openEditKeywords();
    await modal.expectValidationAndCancel();
  });

  test('[TC-688] отмена Edit keywords удаляет несохранённый черновик', async ({ checksPage }) => {
    await allure.allureId('688');
    await checksPage.navigate();
    const modal = await checksPage.openEditKeywords();
    await modal.expectDraftDiscarded('unsaved automation draft');
    const reopened = await checksPage.openEditKeywords();
    await reopened.expectEmptyDraft();
  });

  test('[TC-689] невалидный прямой URL Checks обрабатывается без падения приложения', async ({
    checksPage,
  }) => {
    await allure.allureId('689');
    await checksPage.expectInvalidDetailHandled();
  });
});
