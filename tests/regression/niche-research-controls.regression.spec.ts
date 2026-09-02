import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import { nicheResearchApi, nicheResearchItem, nicheResearchList } from '@support/niches';

const managerId = '00000000-0000-4000-8000-900000000002';
const newNiche = nicheResearchItem(0, { name: 'Alpha research niche' });
const assignedNiche = nicheResearchItem(1, {
  name: 'Beta assigned niche',
  aso_manager: managerId,
  aso_manager_name: 'Мария Исследователь',
});

async function setMetadata(goal: string): Promise<void> {
  await allure.epic('CRM');
  await allure.feature('Niche research');
  await allure.story('FRONT-98 · управление списком');
  await allure.description(`
**Цель:** ${goal}

**Контекст:** подраздел Niches → Research.

**Предусловия:** admin авторизован; ответы списка контролируются тестом.

**Сценарий:** использовать доступный контрол списка или административное действие.

**Ожидаемый результат:** отображается соответствующее состояние FRONT-98 без технических значений.
`);
}

test.describe('FRONT-98 → управление Niches for research', { tag: '@niche-research' }, () => {
  test.beforeEach(async ({ network, nichesPage }) => {
    await network.mockJson(nicheResearchApi.asoManagers, 'GET', [
      { id: managerId, name: assignedNiche.aso_manager_name },
    ]);
    await network.mockJson(nicheResearchApi.managerFilter, 'GET', {
      users: [
        {
          employee_id: managerId,
          employee_name: assignedNiche.aso_manager_name,
          id: managerId,
          name: assignedNiche.aso_manager_name,
        },
      ],
    });
    await network.fulfillNextJson(
      nicheResearchApi.list,
      'QUERY',
      nicheResearchList([newNiche, assignedNiche]),
    );
    await nichesPage.navigateToResearch();
  });

  test('[TC-1121] открывает панель фильтров списка', async ({ nichesPage }) => {
    await allure.allureId('1121');
    await setMetadata('Проверить доступность панели фильтров списка.');

    await nichesPage.research.openFilters();
  });

  test('[TC-1122] проходит форму создания без сохранения', async ({ nichesPage }) => {
    await allure.allureId('1122');
    await setMetadata('Проверить полный безопасный путь формы создания.');

    await nichesPage.research.openCreate();
    await nichesPage.research.create.fillRequiredFields('Draft niche', 'Draft description');
    await nichesPage.research.create.toggleNeuroCategory();
    await nichesPage.research.create.expectSubmitEnabled();
    await nichesPage.research.create.close();
  });

  test('[TC-1123] проходит форму редактирования без сохранения', async ({ nichesPage }) => {
    await allure.allureId('1123');
    await setMetadata('Проверить полный безопасный путь формы редактирования.');

    await nichesPage.research.openEdit(0, newNiche.name, newNiche.description);
    await nichesPage.research.edit.changeName('Draft edited niche');
    await nichesPage.research.edit.close();
  });

  test('[TC-1124] проходит подтверждение удаления без мутации', async ({ nichesPage }) => {
    await allure.allureId('1124');
    await setMetadata('Проверить защищённый путь удаления до подтверждения.');

    await nichesPage.research.openDelete(0);
    await nichesPage.research.deleteDialog.cancel();
    await nichesPage.research.expectRows(2);
  });

  test('[TC-1125] разделяет административные действия New и Revision', async ({ network, nichesPage }) => {
    await allure.allureId('1125');
    await setMetadata('Проверить административные действия для разных состояний ниши.');
    const revision = nicheResearchItem(1, {
      name: 'Revision state niche',
      status: 'Revision',
      research_id: '00000000-0000-4000-8000-700000000002',
    });
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([newNiche, revision]));

    await nichesPage.navigateToResearch();
    await nichesPage.research.expectAdminNewActions(0);
    await nichesPage.research.expectRevisionActions(1);
  });

  test('[TC-1130] показывает назначенного ASO manager', async ({ nichesPage }) => {
    await allure.allureId('1130');
    await setMetadata('Проверить имя назначенного ASO manager в строке.');

    await nichesPage.research.expectRow(1, {
      name: assignedNiche.name,
      description: assignedNiche.description,
      manager: assignedNiche.aso_manager_name,
      createdAt: '02.08.26',
    });
  });

  test('[TC-1132] ищет нишу по названию', async ({ network, nichesPage }) => {
    await allure.allureId('1132');
    await setMetadata('Проверить применение поиска по названию ниши.');
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([assignedNiche]));

    await nichesPage.research.search('Beta');
    await nichesPage.research.expectRowCount(1);
    await nichesPage.research.expectRow(0, {
      name: assignedNiche.name,
      description: assignedNiche.description,
      manager: assignedNiche.aso_manager_name,
      createdAt: '02.08.26',
    });
  });

  test('[TC-1133] сортирует список по Creation date', async ({ network, nichesPage }) => {
    await allure.allureId('1133');
    await setMetadata('Проверить сортировку списка по дате создания.');
    await network.fulfillNextJson(
      nicheResearchApi.list,
      'QUERY',
      nicheResearchList([assignedNiche, newNiche]),
    );

    await nichesPage.research.sortByCreationDate();
    await nichesPage.research.expectRow(0, {
      name: assignedNiche.name,
      description: assignedNiche.description,
      manager: assignedNiche.aso_manager_name,
      createdAt: '02.08.26',
    });
  });

  test('[TC-1134] предлагает фильтры manager, category и status', async ({ nichesPage }) => {
    await allure.allureId('1134');
    await setMetadata('Проверить состав доступных фильтров списка.');

    await nichesPage.research.openFilters();
    await nichesPage.research.openFilterCatalog();
  });

  test('[TC-1135] очищает поиск и восстанавливает список', async ({ network, nichesPage }) => {
    await allure.allureId('1135');
    await setMetadata('Проверить восстановление полного списка после очистки поиска.');
    await network.fulfillJsonSequence(nicheResearchApi.list, 'QUERY', [
      nicheResearchList([assignedNiche]),
      nicheResearchList([newNiche, assignedNiche]),
    ]);

    await nichesPage.research.search('Beta');
    await nichesPage.research.expectRowCount(1);
    await nichesPage.research.search('');
    await nichesPage.research.expectRowCount(2);
  });

  test('[TC-1143] переключает Researched niches и возвращается обратно', async ({ network, nichesPage }) => {
    await allure.allureId('1143');
    await setMetadata('Проверить независимую загрузку обеих вкладок исследования ниш.');
    const researched = nicheResearchItem(2, {
      name: 'Researched result',
      status: 'Approved',
      research_id: '00000000-0000-4000-8000-700000000003',
      research_created_at: '2026-08-03T10:00:00',
    });
    await network.fulfillJsonSequence(nicheResearchApi.list, 'QUERY', [
      nicheResearchList([researched]),
      nicheResearchList([newNiche, assignedNiche]),
    ]);

    await nichesPage.research.openResearched();
    await nichesPage.research.expectResearchedNiche(researched.name);
    await nichesPage.research.openForResearch();
    await nichesPage.research.expectRowCount(2);
  });

  test('[TC-1160] переключает страницы на границе page size + 1', async ({ network, nichesPage }) => {
    await allure.allureId('1160');
    await setMetadata('Проверить пагинацию и отсутствие дублей на границе 10 + 1 строка.');
    const firstPage = Array.from({ length: 10 }, (_, index) => nicheResearchItem(index));
    const last = nicheResearchItem(10);
    await network.fulfillJsonSequence(nicheResearchApi.list, 'QUERY', [
      { items: firstPage, total: 11, limit: 10, offset: 0 },
      { items: [last], total: 11, limit: 10, offset: 10 },
      { items: firstPage, total: 11, limit: 10, offset: 0 },
    ]);

    await nichesPage.navigateToResearch();
    await nichesPage.research.expectRowCount(10);
    await nichesPage.research.expectPagination('1', '2');
    await nichesPage.research.nextPage();
    await nichesPage.research.expectRowCount(1);
    await nichesPage.research.expectRow(0, {
      name: last.name,
      description: last.description,
      manager: 'Not assigned',
      createdAt: '11.08.26',
    });
    await nichesPage.research.expectPagination('2', '2');
    await nichesPage.research.previousPage();
    await nichesPage.research.expectRowCount(10);
    await nichesPage.research.expectPagination('1', '2');
  });

  test('[TC-1157] применяет и сбрасывает ASO manager', async ({ network, nichesPage }) => {
    await allure.allureId('1157');
    await setMetadata('Проверить фактическое применение и сброс ASO manager.');
    const managerCatalog = await network.waitForResponseWhile(
      { url: nicheResearchApi.managerFilter, method: 'GET', status: 200 },
      () => nichesPage.research.openFilters(),
    );
    await managerCatalog.response.finished();
    await nichesPage.research.activateAllFiltersInOpenPanel();
    const filtered = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const selecting = nichesPage.research.chooseFirstAvailableManager();
    const filteredRequest = await filtered.started;
    await filtered.fulfill(nicheResearchList([newNiche]));
    const selectedManager = await selecting;
    await scenarioCheck.matchObject(
      'Запрос содержит выбранного ASO manager',
      filteredRequest.postDataJSON(),
      {
        employee_id: [selectedManager.id],
      },
    );
    await nichesPage.research.expectRowCount(1);

    await network.fulfillNextJson(
      nicheResearchApi.list,
      'QUERY',
      nicheResearchList([newNiche, assignedNiche]),
    );
    await nichesPage.research.resetFilters();
    await nichesPage.research.expectRowCount(2);
  });

  test('[TC-1158] применяет Category и Status', async ({ network, nichesPage }) => {
    await allure.allureId('1158');
    await setMetadata('Проверить фактическое применение Category и Status.');
    await nichesPage.research.activateAllFilters();

    const category = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const selectingCategory = nichesPage.research.chooseFilterValue('category', 'Neuro niche');
    const categoryRequest = await category.started;
    await scenarioCheck.matchObject('Запрос содержит Category Neuro niche', categoryRequest.postDataJSON(), {
      category: ['Neuro niche'],
    });
    await category.fulfill(nicheResearchList([newNiche]));
    await selectingCategory;

    const status = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const selectingStatus = nichesPage.research.chooseFilterValue('status', 'New');
    const statusRequest = await status.started;
    await scenarioCheck.matchObject('Запрос содержит Category и Status', statusRequest.postDataJSON(), {
      category: ['Neuro niche'],
      status: ['New'],
    });
    await status.fulfill(nicheResearchList([newNiche]));
    await selectingStatus;
    await nichesPage.research.expectRowCount(1);
  });

  test('[TC-1159] применяет комбинацию трёх фильтров', async ({ network, nichesPage }) => {
    await allure.allureId('1159');
    await setMetadata('Проверить пересечение ASO manager, Category и Status.');
    const managerCatalog = await network.waitForResponseWhile(
      { url: nicheResearchApi.managerFilter, method: 'GET', status: 200 },
      () => nichesPage.research.openFilters(),
    );
    await managerCatalog.response.finished();
    await nichesPage.research.activateAllFiltersInOpenPanel();
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([newNiche]));
    const selectedManager = await nichesPage.research.chooseFirstAvailableManager();
    await network.fulfillNextJson(nicheResearchApi.list, 'QUERY', nicheResearchList([newNiche]));
    await nichesPage.research.chooseFilterValue('category', 'Neuro niche');
    await nichesPage.research.expectRowCount(1);

    const combined = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const selecting = nichesPage.research.chooseFilterValue('status', 'New');
    const request = await combined.started;
    await scenarioCheck.matchObject('Запрос содержит полную комбинацию фильтров', request.postDataJSON(), {
      employee_id: [selectedManager.id],
      category: ['Neuro niche'],
      status: ['New'],
    });
    await combined.fulfill(nicheResearchList([newNiche]));
    await selecting;
    await nichesPage.research.expectRowCount(1);
  });

  test('[TC-1171] отправляет точные контракты поиска, сортировки и вкладки', async ({
    network,
    nichesPage,
  }) => {
    await allure.allureId('1171');
    await setMetadata('Проверить полное тело запросов управления списком.');

    const search = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const searching = nichesPage.research.search('Beta');
    const searchRequest = await search.started;
    await scenarioCheck.deepEqual('Поиск отправляет точное тело', searchRequest.postDataJSON(), {
      limit: 10,
      offset: 0,
      researched: false,
      search: 'Beta',
      sort_by: 'created_at',
    });
    await search.fulfill(nicheResearchList([assignedNiche]));
    await searching;

    const sort = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const sorting = nichesPage.research.sortByCreationDate();
    const sortRequest = await sort.started;
    await scenarioCheck.deepEqual('Сортировка отправляет точное тело', sortRequest.postDataJSON(), {
      limit: 10,
      offset: 0,
      researched: false,
      search: 'Beta',
      sort_by: 'created_at',
      sort_order: 'asc',
    });
    await sort.fulfill(nicheResearchList([assignedNiche]));
    await sorting;

    const researched = await network.holdNextJson(nicheResearchApi.list, 'QUERY');
    const opening = nichesPage.research.openResearched();
    const researchedRequest = await researched.started;
    await scenarioCheck.deepEqual(
      'Researched niches отправляет точное тело',
      researchedRequest.postDataJSON(),
      {
        limit: 10,
        offset: 0,
        researched: true,
        search: 'Beta',
        sort_by: 'research_created_at',
        sort_order: 'desc',
      },
    );
    await researched.fulfill(nicheResearchList([]));
    await opening;
  });
});
