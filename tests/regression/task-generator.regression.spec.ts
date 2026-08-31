import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import { taskGeneratorApi } from '@support/task-generator';

test.describe('Task generator', () => {
  test.beforeEach('ПОДГОТОВКА · Открыть CRM с авторизованной сессией', async ({ dashboardPage }) => {
    await dashboardPage.navigate();
  });

  test('[TC-611] поиск обновляет и восстанавливает историю генераций', async ({ taskGeneratorPage }) => {
    await allure.allureId('611');
    await taskGeneratorPage.openFromSidebar();
    await taskGeneratorPage.content.expectSearchFiltersRows();
  });

  test('[TC-612] Generate отправляет только подтверждённые валидные данные', async ({
    network,
    taskGeneratorPage,
  }) => {
    await allure.allureId('612');
    await taskGeneratorPage.openFromSidebar();
    const request = await network.holdNextMutation(/\/master\/api\/v1\/task-generator/);
    await taskGeneratorPage.content.fillGenerateForm('1', 'Автотест безопасного подтверждения');
    await taskGeneratorPage.content.submitGenerate();
    const started = await request.started;
    await scenarioCheck.equal('Generate использует POST', started.method(), 'POST');
    await request.abort();
  });

  test('[TC-613] checkbox строки и Select all выбирают документы', async ({ taskGeneratorPage }) => {
    await allure.allureId('613');
    await taskGeneratorPage.openFromSidebar();
    await taskGeneratorPage.content.expectSelection();
  });

  test('[TC-713] ошибка API скрывает частичные данные и сохраняет каркас', async ({
    network,
    taskGeneratorPage,
  }) => {
    await allure.allureId('713');
    await network.failNext(taskGeneratorApi.documents, 'GET', { detail: 'controlled failure' });
    await taskGeneratorPage.openWithoutContentWait();
    await taskGeneratorPage.content.expectErrorState();
  });

  test('[TC-714] загрузка завершается после ответа API', async ({ network, taskGeneratorPage }) => {
    await allure.allureId('714');
    const held = await network.holdNextJson(taskGeneratorApi.documents, 'GET');
    await taskGeneratorPage.openWithoutContentWait();
    await held.started;
    await held.fulfill(taskGeneratorApi.emptyDocuments);
    await taskGeneratorPage.content.expectLoaded();
  });

  test('[TC-715] пустой ответ отображается без технических значений', async ({
    network,
    taskGeneratorPage,
  }) => {
    await allure.allureId('715');
    await network.fulfillNextJson(taskGeneratorApi.documents, 'GET', taskGeneratorApi.emptyDocuments);
    await taskGeneratorPage.openWithoutContentWait();
    await taskGeneratorPage.content.expectLoaded();
    await taskGeneratorPage.content.expectEmpty();
  });

  test('[TC-716] сортировка Date обновляет параметры истории', async ({ taskGeneratorPage }) => {
    await allure.allureId('716');
    await taskGeneratorPage.openFromSidebar();
    await taskGeneratorPage.content.sortByDate();
  });

  test('[TC-717] Generate валидирует граничные значения количества', async ({ taskGeneratorPage }) => {
    await allure.allureId('717');
    await taskGeneratorPage.openFromSidebar();
    await taskGeneratorPage.content.expectInvalidCounts();
  });

  test('[TC-718] обновление страницы сбрасывает несохранённый черновик', async ({ taskGeneratorPage }) => {
    await allure.allureId('718');
    await taskGeneratorPage.openFromSidebar();
    await taskGeneratorPage.content.expectDraftResetAfterReload();
  });

  test('[TC-720] docx-действия доступны для разных строк', async ({ taskGeneratorPage }) => {
    await allure.allureId('720');
    await taskGeneratorPage.openFromSidebar();
    await taskGeneratorPage.content.expectDocumentActions();
  });
});
