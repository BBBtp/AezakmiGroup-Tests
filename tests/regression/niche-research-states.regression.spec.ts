import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { nicheResearchApi, nicheResearchItem, nicheResearchList } from '@support/niches';

async function setMetadata(goal: string): Promise<void> {
  await allure.epic('CRM');
  await allure.feature('Niche research');
  await allure.story('FRONT-98 · состояния списка');
  await allure.description(`
**Цель:** ${goal}

**Контекст:** подраздел Niches → Research.

**Предусловия:** admin авторизован; сетевой ответ контролируется тестом.

**Сценарий:** открыть Niches for research и проверить наблюдаемое состояние.

**Ожидаемый результат:** состояние соответствует FRONT-98, устаревшие и технические значения отсутствуют.
`);
}

test.describe('FRONT-98 → состояния Niches for research', { tag: '@niche-research' }, () => {
  test('[TC-1128] показывает Revision и только действие More', async ({ network, nichesPage }) => {
    await allure.allureId('1128');
    await setMetadata('Проверить статус Revision и доступные действия строки.');
    await network.fulfillNextJson(
      nicheResearchApi.list,
      'QUERY',
      nicheResearchList([
        nicheResearchItem(0, {
          name: 'Revision niche',
          status: 'Revision',
          research_id: '00000000-0000-4000-8000-700000000001',
        }),
      ]),
    );

    await nichesPage.navigateToResearch();
    await nichesPage.research.expectRevisionActions(0);
  });

  test('[TC-1131] сокращает длинное Description и показывает See more', async ({ network, nichesPage }) => {
    await allure.allureId('1131');
    await setMetadata('Проверить безопасное отображение длинного описания.');
    const description = 'Очень длинное контролируемое описание '.repeat(20).trim();
    await network.fulfillNextJson(
      nicheResearchApi.list,
      'QUERY',
      nicheResearchList([nicheResearchItem(0, { name: 'Long description niche', description })]),
    );

    await nichesPage.navigateToResearch();
    await nichesPage.research.expectLongDescription(0, description);
  });

  test('[TC-1169] раскрывает точное содержимое See more', async ({ network, nichesPage }) => {
    await allure.allureId('1169');
    await setMetadata('Проверить точное полное описание после раскрытия See more.');
    const description = `Начало ${'полного контролируемого описания '.repeat(24).trim()} Конец`;
    await network.fulfillNextJson(
      nicheResearchApi.list,
      'QUERY',
      nicheResearchList([nicheResearchItem(0, { name: 'See more exact content', description })]),
    );

    await nichesPage.navigateToResearch();
    await nichesPage.research.expectLongDescription(0, description);
    await nichesPage.research.revealLongDescription(0, description);
  });

  test('[TC-1144] завершает loading успешным списком', async ({ network, nichesPage }) => {
    await allure.allureId('1144');
    await setMetadata('Проверить завершение управляемого loading state.');
    const held = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const opening = nichesPage.navigateToResearchRoute();
    await held.started;
    await nichesPage.research.expectLoading();
    await held.fulfill(nicheResearchList([nicheResearchItem(0, { name: 'Loaded niche' })]));
    await opening;
    await nichesPage.research.expectRows(1);
  });

  test('[TC-1145] показывает пустой список без технических значений', async ({ network, nichesPage }) => {
    await allure.allureId('1145');
    await setMetadata('Проверить empty state для items=[] и total=0.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([]));

    await nichesPage.navigateToResearchRoute();
    await nichesPage.research.expectEmpty();
  });

  test('[TC-1146] показывает ошибку без устаревших строк', async ({ network, nichesPage }) => {
    await allure.allureId('1146');
    await setMetadata('Проверить безопасное состояние при ошибке загрузки списка.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', { detail: 'Controlled failure' }, 500);

    await nichesPage.navigateToResearchRoute();
    await nichesPage.research.expectError();
  });

  test('[TC-1147] обрабатывает некорректный ответ без технических значений', async ({
    network,
    nichesPage,
  }) => {
    await allure.allureId('1147');
    await setMetadata('Проверить безопасное состояние при нарушении контракта ответа списка.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', { items: null, total: null });

    await nichesPage.navigateToResearchRoute();
    await nichesPage.research.expectError();
  });
});
