import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { nicheResearchApi, nicheResearchItem, nicheResearchList } from '@support/niches';

const assignedManagerId = '00000000-0000-4000-8000-900000000001';

async function setFront98Metadata(goal: string): Promise<void> {
  await allure.epic('CRM');
  await allure.feature('Niche research');
  await allure.story('FRONT-98 · Niches for research');
  await allure.description(`
**Цель:** ${goal}

**Контекст:** подраздел Niches → Research, вкладка Niches for research.

**Предусловия:** admin авторизован; ответ списка контролируется тестом.

**Сценарий:** открыть страницу и проверить наблюдаемое состояние таблицы.

**Ожидаемый результат:** интерфейс соответствует контракту FRONT-98 и не отображает технические значения.
`);
}

test.describe('FRONT-98 → таблица Niches for research', { tag: '@niche-research' }, () => {
  test('[TC-1120] открывает раздел и показывает структуру таблицы', async ({ network, nichesPage }) => {
    await allure.allureId('1120');
    await setFront98Metadata('Проверить доступность раздела, вкладок и бизнес-данных таблицы.');
    const items = [
      nicheResearchItem(0, {
        name: 'Assigned niche',
        description: 'Assigned description',
        aso_manager: assignedManagerId,
        aso_manager_name: 'Анна Менеджер',
      }),
      nicheResearchItem(1, { name: 'Unassigned niche', description: 'No manager description' }),
    ];
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(items));

    await nichesPage.navigateToResearch();
    await nichesPage.research.expectRows(2);
    await nichesPage.research.expectRow(0, {
      name: 'Assigned niche',
      description: 'Assigned description',
      manager: 'Анна Менеджер',
      createdAt: '01.08.26',
    });
    await nichesPage.research.expectRow(1, {
      name: 'Unassigned niche',
      description: 'No manager description',
      manager: 'Not assigned',
      createdAt: '02.08.26',
    });
    await nichesPage.research.expectNoTechnicalValues();
  });

  test('[TC-1127] показывает New-нишу без назначенного ASO manager', async ({ network, nichesPage }) => {
    await allure.allureId('1127');
    await setFront98Metadata('Проверить Not assigned и административные действия строки New.');
    await network.fulfillNextJson(
      nicheResearchApi.list,
      'QUERY',
      nicheResearchList([nicheResearchItem(0, { name: 'New unassigned niche' })]),
    );

    await nichesPage.navigateToResearch();
    await nichesPage.research.expectRow(0, {
      name: 'New unassigned niche',
      description: 'Контролируемое описание 1',
      manager: 'Not assigned',
      createdAt: '01.08.26',
    });
    await nichesPage.research.expectAdminNewActions(0);
    await nichesPage.research.expectNoTechnicalValues();
  });

  test('[TC-1129] показывает иконку только для категории Neuro niche', async ({ network, nichesPage }) => {
    await allure.allureId('1129');
    await setFront98Metadata('Проверить визуальный маркер категории Neuro niche.');
    await network.fulfillNextJson(
      nicheResearchApi.list,
      'QUERY',
      nicheResearchList([
        nicheResearchItem(0, { name: 'Neuro category', category: ['Neuro niche'] }),
        nicheResearchItem(1, { name: 'Without category' }),
      ]),
    );

    await nichesPage.navigateToResearch();
    await nichesPage.research.expectRows(2);
    await nichesPage.research.expectNeuroCategory(0);
    await nichesPage.research.expectNoTechnicalValues();
  });
});
