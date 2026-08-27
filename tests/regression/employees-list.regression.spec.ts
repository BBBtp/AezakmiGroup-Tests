import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { employeesApi } from '@support/employees/contracts';

test.describe('Staff / Employees', () => {
  test('[TC-638] таблица сотрудников поддерживает сортировку и пагинацию', async ({ employeesPage }) => {
    await allure.allureId('638');
    await employeesPage.navigate();
    await employeesPage.list.sortByTimeZone();
    await employeesPage.list.openNextPageAndReturn();
  });

  test('[TC-641] карточка выбранного сотрудника открывается из списка', async ({ administrationPage }) => {
    await allure.allureId('641');
    await administrationPage.openEmployees();
    await administrationPage.content.openFirstEmployee();
  });

  test('[TC-751] ошибка API отображается без устаревших строк', async ({ employeesPage, network }) => {
    await allure.allureId('751');
    await network.failNext(employeesApi.list, 'GET', { message: 'Test failure' });
    await employeesPage.openRoute();
    await employeesPage.list.expectError();
    await network.reload();
    await employeesPage.list.expectLoaded();
  });

  test('[TC-752] loading state завершается после восстановления API', async ({ employeesPage, network }) => {
    await allure.allureId('752');
    const held = await network.holdNext(employeesApi.list, 'GET');
    const opening = employeesPage.openRoute();
    await held.started;
    await employeesPage.list.expectLoading();
    await held.abort();
    await opening.catch(() => undefined);
    await network.reload();
    await employeesPage.list.expectLoaded();
  });

  test('[TC-753] поиск без совпадений показывает empty state и сбрасывается', async ({ employeesPage }) => {
    await allure.allureId('753');
    await employeesPage.navigate();
    await employeesPage.list.searchForMissingEmployee('codex-no-such-employee-2026');
    await employeesPage.list.resetSearch();
  });
});
