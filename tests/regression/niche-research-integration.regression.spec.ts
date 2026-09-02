import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import { nicheResearchApi } from '@support/niches';

test.describe('FRONT-98 → real backend Niche research', { tag: '@niche-research' }, () => {
  test.describe.configure({ mode: 'serial' });

  test('[TC-1161] выполняет реальный CRUD lifecycle с cleanup', async ({
    cleanup,
    dataFactory,
    network,
    nichesPage,
  }) => {
    await allure.allureId('1161');
    await allure.epic('CRM');
    await allure.feature('Niche research');
    await allure.story('FRONT-98 · интеграционный CRUD');
    await allure.description(`
**Цель:** подтвердить полный CRUD через реальный backend.

**Контекст:** admin работает с уникальной исследуемой нишей.

**Предусловия:** backend доступен; компенсационный cleanup регистрируется до POST.

**Сценарий:** создать, прочитать после reload, изменить и удалить сущность.

**Ожидаемый результат:** каждый реальный запрос успешен, данные сохраняются между загрузками и гарантированно очищаются.
`);

    const initialName = dataFactory.uniqueLabel('pw-front-98');
    const editedName = `${initialName}-edited`;
    const description = 'Playwright FRONT-98 integration cleanup';
    let cleanupName = initialName;

    const cleanupHandle = cleanup.register(`Niche research ${initialName}`, async () => {
      await nichesPage.navigateToResearch();
      await nichesPage.research.search(cleanupName);
      await nichesPage.research.deleteFirstRowIfPresent();
    });

    await nichesPage.navigateToResearch();
    await nichesPage.research.openCreate();
    await nichesPage.research.create.fillRequiredFields(initialName, description);
    const { response: created } = await network.waitForResponseWhile(
      { url: nicheResearchApi.create, method: 'POST', status: (value) => value >= 200 && value < 300 },
      () => nichesPage.research.create.submit(),
    );
    await scenarioCheck.equal('Реальный POST выполнен один раз', created.request().method(), 'POST');

    await network.reload();
    await nichesPage.research.search(initialName);
    await nichesPage.research.expectRows(1);

    await nichesPage.research.openEdit(0, initialName, description);
    await nichesPage.research.edit.changeName(editedName);
    const { response: edited } = await network.waitForResponseWhile(
      { url: nicheResearchApi.item, method: 'PATCH', status: (value) => value >= 200 && value < 300 },
      () => nichesPage.research.edit.submit(),
    );
    await scenarioCheck.equal(
      'Реальный PATCH выполнен для созданной сущности',
      edited.request().method(),
      'PATCH',
    );
    cleanupName = editedName;

    await network.reload();
    await nichesPage.research.search(editedName);
    await nichesPage.research.expectRows(1);
    await nichesPage.research.openDelete(0);
    const { response: deleted } = await network.waitForResponseWhile(
      { url: nicheResearchApi.item, method: 'DELETE', status: (value) => value >= 200 && value < 300 },
      () => nichesPage.research.deleteDialog.confirm(),
    );
    await scenarioCheck.equal(
      'Реальный DELETE выполнен для созданной сущности',
      deleted.request().method(),
      'DELETE',
    );
    cleanupHandle.dismiss();

    await network.reload();
    await nichesPage.research.search(editedName);
    await nichesPage.research.expectRowCount(0);
  });
});
