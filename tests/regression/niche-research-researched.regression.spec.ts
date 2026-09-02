import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import { nicheResearchApi, nicheResearchItem, nicheResearchList } from '@support/niches';

const managerId = '00000000-0000-4000-8000-910000000001';
const researched = [
  nicheResearchItem(20, {
    name: 'Waiting researched niche',
    status: 'Waiting',
    aso_manager: managerId,
    aso_manager_name: 'Мария Исследователь',
    research_id: '00000000-0000-4000-8000-920000000001',
    created_at: '2026-03-12T10:00:00',
    research_created_at: '2026-03-12T11:00:00',
  }),
  nicheResearchItem(21, {
    name: 'Revision researched niche',
    status: 'Revision',
    aso_manager: managerId,
    aso_manager_name: 'Мария Исследователь',
    category: ['Neuro niche'],
    research_id: '00000000-0000-4000-8000-920000000002',
    created_at: '2026-03-10T10:00:00',
    research_created_at: '2026-03-11T11:00:00',
  }),
  nicheResearchItem(22, {
    name: 'Approved researched niche',
    status: 'Approved',
    aso_manager: managerId,
    aso_manager_name: 'Мария Исследователь',
    research_id: '00000000-0000-4000-8000-920000000003',
    research_created_at: '2026-03-09T11:00:00',
  }),
  nicheResearchItem(23, {
    name: 'Rejected researched niche',
    status: 'Rejected',
    aso_manager: managerId,
    aso_manager_name: 'Мария Исследователь',
    research_id: '00000000-0000-4000-8000-920000000004',
    research_created_at: '2026-03-08T11:00:00',
  }),
];

async function setMetadata(goal: string): Promise<void> {
  await allure.epic('CRM');
  await allure.feature('Niche research');
  await allure.story('FRONT-98 · Researched niches');
  await allure.description(`
**Цель:** ${goal}

**Контекст:** вторая вкладка Researched niches подраздела Niches → Research.

**Предусловия:** admin авторизован; ответы списка контролируются тестом.

**Сценарий:** выполнить одно атомарное действие на вкладке Researched niches.

**Ожидаемый результат:** таблица, запрос или системное состояние соответствует макетам FRONT-98.
`);
}

test.describe('FRONT-98 → Researched niches', { tag: '@niche-research' }, () => {
  test.beforeEach(async ({ network, nichesPage }) => {
    await network.mockJson(nicheResearchApi.asoManagers, 'GET', [
      { id: managerId, name: researched[0].aso_manager_name },
    ]);
    await network.mockJson(nicheResearchApi.managerFilter, 'GET', {
      users: [
        {
          employee_id: managerId,
          employee_name: researched[0].aso_manager_name,
          id: managerId,
          name: researched[0].aso_manager_name,
        },
      ],
    });
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([nicheResearchItem(0)]));
    await nichesPage.navigateToResearch();
  });

  test('[TC-1187] отображает основные поля таблицы', async ({ network, nichesPage }) => {
    await allure.allureId('1187');
    await setMetadata('Проверить состав и значения строки исследованной ниши.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    await nichesPage.research.expectResearchedRow(0, {
      name: researched[0].name,
      status: 'Waiting',
      manager: researched[0].aso_manager_name,
      createdAt: '12.03.26',
      researchedAt: '12.03.26',
    });
  });

  test('[TC-1188] отображает статусы исследованных ниш', async ({ network, nichesPage }) => {
    await allure.allureId('1188');
    await setMetadata('Проверить Waiting, Revision, Approved и Rejected в независимых строках.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    for (const [index, item] of researched.entries()) {
      await nichesPage.research.expectResearchedRow(index, {
        name: item.name,
        status: item.status,
        manager: item.aso_manager_name,
        createdAt: index === 0 ? '12.03.26' : index === 1 ? '10.03.26' : `${index + 21}.08.26`,
        researchedAt:
          index === 0 ? '12.03.26' : index === 1 ? '11.03.26' : index === 2 ? '09.03.26' : '08.03.26',
      });
    }
  });

  test('[TC-1189] сортирует по Creation date', async ({ network, nichesPage }) => {
    await allure.allureId('1189');
    await setMetadata('Проверить атомарный запрос сортировки по дате создания.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    await nichesPage.research.expectResearchedRowCount(4);
    const held = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const sorting = nichesPage.research.sortByCreationDate();
    const request = await held.started;
    await scenarioCheck.matchObject('Сортировка использует created_at', request.postDataJSON(), {
      researched: true,
      sort_by: 'created_at',
      sort_order: 'asc',
    });
    await held.fulfill(nicheResearchList([...researched].reverse()));
    await sorting;
  });

  test('[TC-1174] сортирует по Research date', async ({ network, nichesPage }) => {
    await allure.allureId('1174');
    await setMetadata('Проверить атомарный запрос сортировки по дате исследования.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    await nichesPage.research.expectResearchedRowCount(4);
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await network.waitForResponseWhile({ url: nicheResearchApi.list, method: 'QUERY', status: 200 }, () =>
      nichesPage.research.sortByCreationDate(),
    );
    await nichesPage.research.expectResearchedRowCount(4);
    await network.mockJson(nicheResearchApi.list, 'QUERY', nicheResearchList([...researched].reverse()));
    const { request } = await network.waitForRequestWhile(
      { url: nicheResearchApi.list, method: 'QUERY' },
      () => nichesPage.research.sortByResearchDate(),
    );
    await scenarioCheck.matchObject('Сортировка использует research_created_at', request.postDataJSON(), {
      researched: true,
      sort_by: 'research_created_at',
      sort_order: 'asc',
    });
  });

  test('[TC-1175] переключает страницы списка', async ({ network, nichesPage }) => {
    await allure.allureId('1175');
    await setMetadata('Проверить границу 10 + 1 строка на второй вкладке.');
    const first = Array.from({ length: 10 }, (_, index) => ({
      ...researched[0],
      id: `00000000-0000-4000-8000-9300000000${String(index).padStart(2, '0')}`,
      name: `Researched page ${index + 1}`,
    }));
    const last = { ...researched[1], name: 'Researched page 11' };
    await network.fulfillJsonSequence(nicheResearchApi.list, 'QUERY', [
      { ...nicheResearchList(first), total: 11 },
      { ...nicheResearchList([last]), total: 11, offset: 10 },
      { ...nicheResearchList(first), total: 11 },
    ]);
    await nichesPage.research.openResearched();
    await nichesPage.research.expectResearchedRowCount(10);
    await nichesPage.research.nextPage();
    await nichesPage.research.expectResearchedNiche(last.name);
    await nichesPage.research.previousPage();
    await nichesPage.research.expectResearchedRowCount(10);
  });

  test('[TC-1176] ищет исследованную нишу по названию', async ({ network, nichesPage }) => {
    await allure.allureId('1176');
    await setMetadata('Проверить поиск и точный параметр search.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    await nichesPage.research.expectResearchedRowCount(4);
    const held = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const searching = nichesPage.research.search('Revision researched niche');
    const request = await held.started;
    await scenarioCheck.matchObject('Поиск передаёт название', request.postDataJSON(), {
      researched: true,
      search: 'Revision researched niche',
    });
    await held.fulfill(nicheResearchList([researched[1]]));
    await searching;
    await nichesPage.research.expectResearchedNiche(researched[1].name);
  });

  test('[TC-1177] применяет ASO manager', async ({ network, nichesPage }) => {
    await allure.allureId('1177');
    await setMetadata('Проверить ASO manager независимо от остальных фильтров.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    const managerCatalog = await network.waitForResponseWhile(
      { url: nicheResearchApi.managerFilter, method: 'GET', status: 200 },
      () => nichesPage.research.openFilters(),
    );
    await managerCatalog.response.finished();
    await nichesPage.research.activateAllFiltersInOpenPanel();
    const held = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const filtering = nichesPage.research.chooseFirstAvailableManager();
    const request = await held.started;
    await held.fulfill(nicheResearchList([researched[0]]));
    const selectedManager = await filtering;
    await scenarioCheck.matchObject('Запрос содержит ASO manager', request.postDataJSON(), {
      researched: true,
      employee_id: [selectedManager.id],
    });
  });

  test('[TC-1178] применяет Category', async ({ network, nichesPage }) => {
    await allure.allureId('1178');
    await setMetadata('Проверить Category независимо от остальных фильтров.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    await nichesPage.research.activateAllFilters();
    const held = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const filtering = nichesPage.research.chooseFilterValue('category', 'Neuro niche');
    const request = await held.started;
    await scenarioCheck.matchObject('Запрос содержит Category', request.postDataJSON(), {
      researched: true,
      category: ['Neuro niche'],
    });
    await held.fulfill(nicheResearchList([researched[1]]));
    await filtering;
  });

  test('[TC-1179] применяет Status', async ({ network, nichesPage }) => {
    await allure.allureId('1179');
    await setMetadata('Проверить Status независимо от остальных фильтров.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    await nichesPage.research.activateAllFilters();
    const held = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const filtering = nichesPage.research.chooseFilterValue('status', 'Approved');
    const request = await held.started;
    await scenarioCheck.matchObject('Запрос содержит Status', request.postDataJSON(), {
      researched: true,
      status: ['Approved'],
    });
    await held.fulfill(nicheResearchList([researched[2]]));
    await filtering;
  });

  test('[TC-1180] применяет комбинацию трёх фильтров', async ({ network, nichesPage }) => {
    await allure.allureId('1180');
    await setMetadata('Проверить пересечение ASO manager, Category и Status.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    const managerCatalog = await network.waitForResponseWhile(
      { url: nicheResearchApi.managerFilter, method: 'GET', status: 200 },
      () => nichesPage.research.openFilters(),
    );
    await managerCatalog.response.finished();
    await nichesPage.research.activateAllFiltersInOpenPanel();
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    const selectedManager = await nichesPage.research.chooseFirstAvailableManager();
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([researched[1]]));
    await nichesPage.research.chooseFilterValue('category', 'Neuro niche');
    await nichesPage.research.expectResearchedRowCount(1);
    const held = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const filtering = nichesPage.research.chooseFilterValue('status', 'Revision');
    const request = await held.started;
    await scenarioCheck.matchObject('Запрос содержит три фильтра', request.postDataJSON(), {
      researched: true,
      employee_id: [selectedManager.id],
      category: ['Neuro niche'],
      status: ['Revision'],
    });
    await held.fulfill(nicheResearchList([researched[1]]));
    await filtering;
  });

  test('[TC-1181] сбрасывает активные фильтры', async ({ network, nichesPage }) => {
    await allure.allureId('1181');
    await setMetadata('Проверить сброс фильтров без смены вкладки.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    await nichesPage.research.activateAllFilters();
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([researched[2]]));
    await nichesPage.research.chooseFilterValue('status', 'Approved');
    await nichesPage.research.expectResearchedRowCount(1);
    await nichesPage.research.resetFilters();
    await nichesPage.research.expectResearchedRowCount(4);
  });

  test('[TC-1182] показывает пустой результат фильтрации', async ({ network, nichesPage }) => {
    await allure.allureId('1182');
    await setMetadata('Проверить специальное empty state активных фильтров.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.openResearched();
    await nichesPage.research.expectResearchedRowCount(4);
    await nichesPage.research.activateAllFilters();
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([]));
    await nichesPage.research.chooseFilterValue('status', 'Rejected');
    await nichesPage.research.expectFilteredEmpty();
  });

  test('[TC-1183] показывает пустую вкладку без исследований', async ({ network, nichesPage }) => {
    await allure.allureId('1183');
    await setMetadata('Проверить No researches yet без технических значений.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([]));
    await nichesPage.research.openResearched();
    await nichesPage.research.expectResearchedEmpty();
  });

  test('[TC-1184] завершает loading успешной таблицей', async ({ network, nichesPage }) => {
    await allure.allureId('1184');
    await setMetadata('Проверить skeleton до завершения запроса второй вкладки.');
    const held = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const opening = nichesPage.research.openResearched();
    await held.started;
    await nichesPage.research.expectLoading();
    await network.mockJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await held.fulfill(nicheResearchList(researched));
    await opening;
    await nichesPage.research.expectResearchedRowCount(4);
  });

  test('[TC-1185] повторяет запрос после ошибки', async ({ network, nichesPage }) => {
    await allure.allureId('1185');
    await setMetadata('Проверить ошибку и успешное восстановление второй вкладки.');
    await network.failNext(nicheResearchApi.list, 'QUERY', { detail: 'Controlled researched failure' });
    await nichesPage.research.openResearched();
    await nichesPage.research.expectError();
    await network.mockJson(nicheResearchApi.list, 'QUERY', nicheResearchList(researched));
    await nichesPage.research.repeatRequest();
    await nichesPage.research.expectResearchedRowCount(4);
  });

  test('[TC-1186] показывает действие More в строке', async ({ network, nichesPage }) => {
    await allure.allureId('1186');
    await setMetadata('Проверить доступность More для исследованной ниши.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([researched[2]]));
    await nichesPage.research.openResearched();
    await nichesPage.research.expectMoreAction(researched[2].name);
  });
});
