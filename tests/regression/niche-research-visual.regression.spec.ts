import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { nicheResearchApi, nicheResearchItem, nicheResearchList } from '@support/niches';

const stableItems = [
  nicheResearchItem(0, { name: 'Visual research niche', description: 'Stable visual description' }),
  nicheResearchItem(1, { name: 'Responsive research niche', description: 'Responsive description' }),
];

async function metadata(goal: string): Promise<void> {
  await allure.epic('CRM');
  await allure.feature('Niche research');
  await allure.story('FRONT-98 · адаптивность и визуальная стабильность');
  await allure.description(`
**Цель:** ${goal}

**Контекст:** список и CRUD-модали Niche research.

**Предусловия:** admin авторизован; данные и даты стабилизированы.

**Сценарий:** проверить ключевые состояния на согласованных viewport.

**Ожидаемый результат:** управление доступно, элементы не перекрыты, эталонный вид не изменён.
`);
}

test.describe('FRONT-98 → visual Niche research', { tag: '@niche-research' }, () => {
  test.beforeEach(async ({ network, nichesPage }) => {
    await network.mockJson(nicheResearchApi.list, 'QUERY', nicheResearchList(stableItems));
    await nichesPage.navigateToResearch();
  });

  test('[TC-1170] сохраняет доступность на desktop и tablet', async ({ nichesPage }) => {
    await allure.allureId('1170');
    await metadata('Проверить адаптивность списка и формы создания.');
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
    ]) {
      await nichesPage.research.useViewport(viewport.width, viewport.height);
      await nichesPage.research.expectLoaded();
      await nichesPage.research.openCreate();
      await nichesPage.research.create.expectOpen();
      await nichesPage.navigateToResearch();
    }
  });

  test('[TC-1172] сравнивает список и CRUD-модали с эталонами', async ({ nichesPage }) => {
    await allure.allureId('1172');
    await metadata('Проверить визуальную стабильность списка и CRUD-модалей.');
    await nichesPage.research.useViewport(1440, 900);
    await nichesPage.research.expectScreenshot('niche-research-list.png');
    await nichesPage.research.openCreate();
    await nichesPage.research.create.expectScreenshot('niche-research-create.png');
    await nichesPage.research.create.close();
    await nichesPage.research.openEdit(0, stableItems[0].name, stableItems[0].description);
    await nichesPage.research.edit.expectScreenshot('niche-research-edit.png');
    await nichesPage.research.edit.close();
    await nichesPage.research.openDelete(0);
    await nichesPage.research.deleteDialog.expectScreenshot('niche-research-delete.png');
  });
});
