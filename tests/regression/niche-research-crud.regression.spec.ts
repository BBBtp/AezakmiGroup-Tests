import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import { nicheResearchApi, nicheResearchItem, nicheResearchList } from '@support/niches';

const original = nicheResearchItem(0, {
  name: 'CRUD source niche',
  description: 'CRUD source description',
});

async function setMetadata(goal: string): Promise<void> {
  await allure.epic('CRM');
  await allure.feature('Niche research');
  await allure.story('FRONT-98 · CRUD исследуемой ниши');
  await allure.description(`
**Цель:** ${goal}

**Контекст:** подраздел Niches → Research, вкладка Niches for research.

**Предусловия:** admin авторизован; список и мутационные ответы контролируются тестом.

**Сценарий:** выполнить действие с исследуемой нишей через соответствующую модальную форму.

**Ожидаемый результат:** форма и итоговое состояние соответствуют FRONT-98, незапланированные изменения отсутствуют.
`);
}

test.describe('FRONT-98 → CRUD Niches for research', { tag: '@niche-research' }, () => {
  test.beforeEach(async ({ network, nichesPage }) => {
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([original]));
    await nichesPage.navigateToResearch();
  });

  test('[TC-1136] открывает пустую форму создания', async ({ nichesPage }) => {
    await allure.allureId('1136');
    await setMetadata('Проверить начальное состояние формы создания ниши.');
    await nichesPage.research.openCreate();
  });

  test('[TC-1137] включает Create только после заполнения обязательных полей', async ({ nichesPage }) => {
    await allure.allureId('1137');
    await setMetadata('Проверить локальную валидацию обязательных полей формы создания.');
    await nichesPage.research.openCreate();
    await nichesPage.research.create.fillRequiredFields('Valid niche', 'Valid description');
    await nichesPage.research.create.expectSubmitEnabled();
  });

  test('[TC-1138] закрывает создание без отправки данных', async ({ nichesPage }) => {
    await allure.allureId('1138');
    await setMetadata('Проверить отмену создания исследуемой ниши.');
    await nichesPage.research.openCreate();
    await nichesPage.research.create.fillRequiredFields('Cancelled niche', 'Cancelled description');
    await nichesPage.research.create.close();
    await nichesPage.research.expectRows(1);
  });

  test('[TC-1139] открывает редактирование с текущими значениями', async ({ nichesPage }) => {
    await allure.allureId('1139');
    await setMetadata('Проверить предзаполнение формы редактирования текущими данными.');
    await nichesPage.research.openEdit(0, original.name, original.description);
  });

  test('[TC-1140] закрывает редактирование без сохранения', async ({ nichesPage }) => {
    await allure.allureId('1140');
    await setMetadata('Проверить отмену редактирования исследуемой ниши.');
    await nichesPage.research.openEdit(0, original.name, original.description);
    await nichesPage.research.edit.changeName('Cancelled edit');
    await nichesPage.research.edit.close();
    await nichesPage.research.expectRow(0, {
      name: original.name,
      description: original.description,
      manager: 'Not assigned',
      createdAt: '01.08.26',
    });
  });

  test('[TC-1141] открывает необратимое подтверждение удаления', async ({ nichesPage }) => {
    await allure.allureId('1141');
    await setMetadata('Проверить содержание подтверждения удаления исследуемой ниши.');
    await nichesPage.research.openDelete(0);
  });

  test('[TC-1142] отменяет удаление и сохраняет строку', async ({ nichesPage }) => {
    await allure.allureId('1142');
    await setMetadata('Проверить безопасную отмену удаления исследуемой ниши.');
    await nichesPage.research.openDelete(0);
    await nichesPage.research.deleteDialog.cancel();
    await nichesPage.research.expectRows(1);
  });

  test('[TC-1149] успешно редактирует исследуемую нишу', async ({ network, nichesPage }) => {
    await allure.allureId('1149');
    await setMetadata('Проверить успешное сохранение нового названия исследуемой ниши.');
    const updated = { ...original, name: 'Successfully edited niche' };
    await network.fulfillNextJson(nicheResearchApi.checkName, 'GET', false);
    await network.fulfillNextJson(nicheResearchApi.item, 'PATCH', updated);
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([updated]));

    await nichesPage.research.openEdit(0, original.name, original.description);
    await nichesPage.research.edit.changeName(updated.name);
    await nichesPage.research.edit.submit();
    await nichesPage.research.edit.expectClosed();
    await nichesPage.research.expectRow(0, {
      name: updated.name,
      description: updated.description,
      manager: 'Not assigned',
      createdAt: '01.08.26',
    });
  });

  test('[TC-1150] успешно удаляет исследуемую нишу', async ({ network, nichesPage }) => {
    await allure.allureId('1150');
    await setMetadata('Проверить успешное удаление исследуемой ниши из списка.');
    await network.fulfillNextJson(nicheResearchApi.item, 'DELETE', {});
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([]));

    await nichesPage.research.openDelete(0);
    await nichesPage.research.deleteDialog.confirm();
    await nichesPage.research.deleteDialog.expectClosed();
    await nichesPage.research.expectEmpty();
  });

  test('[TC-1151] успешно создаёт исследуемую нишу', async ({ network, nichesPage }) => {
    await allure.allureId('1151');
    await setMetadata('Проверить успешное создание исследуемой ниши.');
    const name = 'Successfully created niche';
    const created = nicheResearchItem(1, { name, description: 'Created description' });
    await network.fulfillNextJson(nicheResearchApi.checkName, 'GET', true);
    await network.fulfillNextJson(nicheResearchApi.create, 'POST', created, 201);
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([created, original]));

    await nichesPage.research.openCreate();
    await nichesPage.research.create.fillRequiredFields(name, created.description);
    await nichesPage.research.create.submit();
    await nichesPage.research.create.expectClosed();
    await nichesPage.research.expectRow(0, {
      name,
      description: created.description,
      manager: 'Not assigned',
      createdAt: '02.08.26',
    });
  });

  test('[TC-1162] не создаёт нишу с дублирующимся именем', async ({ network, nichesPage }) => {
    await allure.allureId('1162');
    await setMetadata('Проверить серверную валидацию дубликата имени.');
    await nichesPage.research.openCreate();
    const check = await network.holdNextJson(nicheResearchApi.checkName, 'GET');
    const filling = nichesPage.research.create.fillRequiredFields(original.name, 'Duplicate description');
    await check.started;
    await check.fulfill(false);
    await filling;
    await nichesPage.research.create.expectSubmitDisabled();
  });

  test('[TC-1164] блокирует пустые и пробельные обязательные поля', async ({ nichesPage }) => {
    await allure.allureId('1164');
    await setMetadata('Проверить локальную валидацию пустых и пробельных значений.');
    await nichesPage.research.openCreate();
    await nichesPage.research.create.fillRequiredFields('   ', '   ');
    await nichesPage.research.create.expectSubmitDisabled();
  });

  test('[TC-1163] контролирует границы длины полей', async ({ network, nichesPage }) => {
    await allure.allureId('1163');
    await setMetadata('Проверить клиентский лимит имени и серверный отказ для чрезмерного описания.');
    const longName = 'N'.repeat(65);
    const acceptedName = longName.slice(0, 64);
    const longDescription = 'D'.repeat(5001);
    await nichesPage.research.openCreate();
    await nichesPage.research.create.expectNameLimit(64);
    await network.fulfillNextJson(nicheResearchApi.checkName, 'GET', true);
    await nichesPage.research.create.fillRequiredFields(longName, longDescription);
    await nichesPage.research.create.expectValues(acceptedName, longDescription);
    await network.failNext(
      nicheResearchApi.create,
      'POST',
      { detail: 'Description exceeds backend limit' },
      422,
    );
    await nichesPage.research.create.submit();
    await nichesPage.research.create.expectOpen();
    await nichesPage.research.create.expectValues(acceptedName, longDescription);
  });

  test('[TC-1168] выбирает и сбрасывает ASO manager', async ({ nichesPage }) => {
    await allure.allureId('1168');
    await setMetadata('Проверить выбор ASO manager и сброс состояния после отмены формы.');
    await nichesPage.research.openCreate();
    await nichesPage.research.create.selectFirstManager();
    await nichesPage.research.create.close();
    await nichesPage.research.openCreate();
    await nichesPage.research.create.expectManagerReset();
  });

  test('[TC-1165] сохраняет форму и данные после ошибки POST', async ({ network, nichesPage }) => {
    await allure.allureId('1165');
    await setMetadata('Проверить отсутствие ложного успеха при ошибке POST.');
    const name = 'POST failure niche';
    const description = 'POST failure description';
    await network.fulfillNextJson(nicheResearchApi.checkName, 'GET', true);
    await network.failNext(nicheResearchApi.create, 'POST', { detail: 'Controlled POST failure' });
    await nichesPage.research.openCreate();
    await nichesPage.research.create.fillRequiredFields(name, description);
    await nichesPage.research.create.submit();
    await nichesPage.research.create.expectOpen();
    await nichesPage.research.create.expectValues(name, description);
  });

  test('[TC-1167] сохраняет исходную строку после ошибки PATCH', async ({ network, nichesPage }) => {
    await allure.allureId('1167');
    await setMetadata('Проверить отсутствие ложного успеха при ошибке PATCH.');
    const changed = 'PATCH failure niche';
    await network.fulfillNextJson(nicheResearchApi.checkName, 'GET', false);
    await network.failNext(nicheResearchApi.item, 'PATCH', { detail: 'Controlled PATCH failure' });
    await nichesPage.research.openEdit(0, original.name, original.description);
    await nichesPage.research.edit.changeName(changed);
    await nichesPage.research.edit.submit();
    await nichesPage.research.edit.expectOpen();
    await nichesPage.research.edit.expectValues(changed, original.description);
  });

  test('[TC-1166] сохраняет строку после ошибки DELETE', async ({ network, nichesPage }) => {
    await allure.allureId('1166');
    await setMetadata('Проверить отсутствие ложного успеха при ошибке DELETE.');
    await network.failNext(nicheResearchApi.item, 'DELETE', { detail: 'Controlled DELETE failure' });
    await nichesPage.research.openDelete(0);
    await nichesPage.research.deleteDialog.confirm();
    await nichesPage.research.expectRows(1);
  });

  test('[TC-1173] отправляет точные POST, PATCH и DELETE контракты', async ({ network, nichesPage }) => {
    await allure.allureId('1173');
    await setMetadata('Проверить полное тело и адрес каждого CRUD-запроса.');
    const created = nicheResearchItem(2, { name: 'Contract niche', description: 'Contract description' });
    await network.fulfillNextJson(nicheResearchApi.checkName, 'GET', true);
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([created, original]));
    const create = await network.holdNextJson(nicheResearchApi.create, 'POST');
    await nichesPage.research.openCreate();
    await nichesPage.research.create.fillRequiredFields(created.name, created.description);
    const submitting = nichesPage.research.create.submit();
    const createRequest = await create.started;
    await scenarioCheck.deepEqual('POST содержит точное тело создания', createRequest.postDataJSON(), {
      name: created.name,
      description: created.description,
      aso_manager: null,
    });
    await create.fulfill(created, 201);
    await submitting;
    await nichesPage.research.create.expectClosed();

    const updated = { ...created, name: 'Contract niche updated', description: 'Updated contract' };
    await network.mockJson(nicheResearchApi.checkName, 'GET', true);
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([updated, original]));
    const patch = await network.holdNextJson(nicheResearchApi.item, 'PATCH');
    await nichesPage.research.openEdit(0, created.name, created.description);
    await nichesPage.research.edit.changeName(updated.name);
    await nichesPage.research.edit.changeDescription(updated.description);
    const editing = nichesPage.research.edit.submit();
    const patchRequest = await patch.started;
    await scenarioCheck.equal(
      'PATCH использует точный URL сущности',
      patchRequest.url().endsWith(`/${created.id}`),
      true,
    );
    await scenarioCheck.deepEqual('PATCH содержит точное тело редактирования', patchRequest.postDataJSON(), {
      id: created.id,
      name: updated.name,
      description: updated.description,
      category: null,
    });
    await patch.fulfill(updated);
    await editing;
    await nichesPage.research.edit.expectClosed();

    const deletion = await network.holdNextJson(nicheResearchApi.item, 'DELETE');
    await nichesPage.research.openDelete(0);
    const deleting = nichesPage.research.deleteDialog.confirm();
    const deleteRequest = await deletion.started;
    await scenarioCheck.equal(
      'DELETE использует точный URL сущности',
      deleteRequest.url().endsWith(`/${created.id}`),
      true,
    );
    await scenarioCheck.isNull('DELETE не содержит тело', deleteRequest.postData());
    await deletion.fulfill({});
    await deleting;
  });
});
