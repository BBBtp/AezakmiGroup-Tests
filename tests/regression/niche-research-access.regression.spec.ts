import { allure } from 'allure-playwright';

import { test } from '@fixtures';

async function setMetadata(goal: string): Promise<void> {
  await allure.epic('CRM');
  await allure.feature('Niche research');
  await allure.story('FRONT-98 · обычный пользователь');
  await allure.description(`
**Цель:** ${goal}

**Контекст:** подраздел Niches → Research открыт под обычным пользователем.

**Предусловия:** пользователь авторизован без административной роли; список контролируется тестом.

**Сценарий:** открыть Niches for research и проверить доступные данные и действия.

**Ожидаемый результат:** закрытый раздел не открывается, административные мутации недоступны.
`);
}

test.describe('FRONT-98 → права обычного пользователя', { tag: '@niche-research' }, () => {
  test.beforeEach(async ({ loginPage, regularUser }) => {
    await loginPage.navigate();
    await loginPage.login(regularUser.email, regularUser.password);
    await loginPage.expectAuthenticated();
  });

  test('[TC-1126] блокирует раздел для обычного пользователя', async ({ loginPage, nichesPage }) => {
    await allure.allureId('1126');
    await setMetadata('Проверить блокировку раздела исследования ниш для обычного пользователя.');

    await nichesPage.navigateToResearchRoute();
    await loginPage.expectPageVisible();
  });

  test('[TC-1148] не раскрывает CRUD через прямой URL', async ({ loginPage, nichesPage }) => {
    await allure.allureId('1148');
    await setMetadata('Проверить отсутствие CRUD-действий после прямого перехода без роли admin.');

    await nichesPage.navigateToResearchRoute();
    await loginPage.expectPageVisible();
    await nichesPage.research.expectAdminControlsHidden();
  });
});
