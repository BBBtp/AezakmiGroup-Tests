import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { apiError } from '@support/niches';

const mutationEndpoint = /\/master\/api\/v1\/.*/;

test.describe('Niches → create, module and edit', () => {
  test.beforeEach(async ({ dashboardPage, nichesPage }) => {
    await dashboardPage.navigate();
    await nichesPage.openFromSidebar();
  });

  test('отменяет и подтверждает создание ниши', async ({ dataFactory, network, nichesPage }) => {
    await allure.allureId('595');
    const name = dataFactory.uniqueLabel('niche');
    await nichesPage.openCreate();
    await nichesPage.create.fillName(name);
    await nichesPage.create.close();
    await nichesPage.openCreate();
    await nichesPage.create.fillName(name);
    await nichesPage.create.selectModule('ASO');
    await nichesPage.create.selectFirstApp();
    await network.fulfillNextMutation(mutationEndpoint, { id: 'mock-niche-id', name, profile: 'ASO' });
    await nichesPage.create.submit();
    await nichesPage.expectNotice('Niche has been successfully added');
  });

  test('открывает карточку той же ниши', async ({ nichesPage }) => {
    await allure.allureId('597');
    const snapshot = await nichesPage.openFirstDetail();
    await nichesPage.detail.expectLoaded(snapshot.name, snapshot.module);
  });

  test('валидирует обязательные и невалидные поля', async ({ nichesPage }) => {
    await allure.allureId('694');
    await nichesPage.openCreate();
    await nichesPage.create.expectSubmitDisabled();
    await nichesPage.create.fillName('x'.repeat(256));
    await nichesPage.create.selectModule('ASO');
    await nichesPage.create.expectSubmitDisabled();
  });

  test('не сохраняет отменённый черновик', async ({ dataFactory, nichesPage }) => {
    await allure.allureId('695');
    const draft = dataFactory.uniqueLabel('draft');
    await nichesPage.openCreate();
    await nichesPage.create.fillName(draft);
    await nichesPage.create.selectModule('Web View');
    await nichesPage.create.close();
    await nichesPage.openCreate();
    await nichesPage.create.expectName('');
  });

  test('проверяет полный UI lifecycle управления нишей', async ({ nichesPage }) => {
    await allure.allureId('912');
    await nichesPage.overview.expectBusinessControls();
    await nichesPage.openFirstDetail();
    await nichesPage.detail.openActions();
    await nichesPage.detail.expectLoaded();
  });

  test('переносит активную нишу в архив', async ({ network, nichesPage }) => {
    await allure.allureId('981');
    const snapshot = await nichesPage.openFirstDetail();
    await network.fulfillNextMutation(mutationEndpoint, { ...snapshot, archive: true });
    await nichesPage.moveActiveNicheToArchive();
    await nichesPage.expectNotice('Niche has been successfully moved to archive');
  });

  test('показывает ошибку переноса активной ниши в архив', async ({ network, nichesPage }) => {
    await allure.allureId('982');
    await nichesPage.openFirstDetail();
    await network.fulfillNextMutation(mutationEndpoint, apiError, 500);
    await nichesPage.moveActiveNicheToArchive();
    await nichesPage.expectNotice('Failed to move to archive');
  });

  test('показывает только ASO и Web View в Module', async ({ nichesPage }) => {
    await allure.allureId('964');
    await nichesPage.openCreate();
    await nichesPage.create.expectModuleOptions();
  });

  test('выбирает ASO и приложение', async ({ nichesPage }) => {
    await allure.allureId('959');
    await nichesPage.openCreate();
    await nichesPage.create.selectModule('ASO');
    await nichesPage.create.selectFirstApp();
  });

  test('выбирает Web View и приложение', async ({ nichesPage }) => {
    await allure.allureId('961');
    await nichesPage.openCreate();
    await nichesPage.create.selectModule('Web View');
    await nichesPage.create.selectFirstApp();
  });

  test('показывает Module в списке ниш', async ({ nichesPage }) => {
    await allure.allureId('963');
    await nichesPage.overview.expectListRows();
    const snapshot = await nichesPage.overview.firstRowSnapshot();
    await nichesPage.overview.expectRow(0, snapshot);
  });

  test('показывает Module в карточке ниши', async ({ nichesPage }) => {
    await allure.allureId('958');
    const snapshot = await nichesPage.openFirstDetail();
    await nichesPage.detail.expectLoaded(snapshot.name, snapshot.module);
  });

  test('предзаполняет форму редактирования', async ({ nichesPage }) => {
    await allure.allureId('965');
    const snapshot = await nichesPage.openFirstDetail();
    await nichesPage.detail.openEdit();
    await nichesPage.edit.expectInitial(snapshot.name, snapshot.module as 'ASO' | 'Web View');
  });

  test('изменяет Module тестовой ниши через mock API', async ({ network, nichesPage }) => {
    await allure.allureId('966');
    const snapshot = await nichesPage.openFirstDetail();
    await nichesPage.detail.openEdit();
    const nextModule = snapshot.module === 'ASO' ? 'Web View' : 'ASO';
    await nichesPage.edit.selectModule(nextModule);
    await nichesPage.edit.expectSubmitEnabled();
    await network.fulfillNextMutation(mutationEndpoint, { ...snapshot, profile: nextModule });
    await nichesPage.edit.submit();
    await nichesPage.expectNotice('Niche has been successfully changed');
  });

  test('показывает конфликт имени и ошибку сохранения', async ({ dataFactory, network, nichesPage }) => {
    await allure.allureId('967');
    await nichesPage.openFirstDetail();
    await nichesPage.detail.openEdit();
    await nichesPage.edit.fillName(dataFactory.uniqueLabel('duplicate-niche'));
    await nichesPage.edit.expectSubmitEnabled();
    await network.fulfillNextMutation(mutationEndpoint, apiError, 409);
    await nichesPage.edit.submit();
    await nichesPage.expectNotice(/already being used|Failed to edit niche/i);
  });
});
