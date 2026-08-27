import { allure } from 'allure-playwright';

import { test, type TestFixtures } from '@fixtures';
import { apiError, archiveNicheData, archiveNiches } from '@support/niches';

const archiveEndpoint = /\/api\/v1\/niches\?archive=true$/;
const mutationEndpoint = /\/master\/api\/v1\/niches\/.*/;

async function openArchive(
  fixtures: Pick<TestFixtures, 'dashboardPage' | 'network' | 'nichesPage'>,
  count: number,
): Promise<void> {
  const { dashboardPage, network, nichesPage } = fixtures;
  await dashboardPage.navigate();
  const activeLoaded = network.waitForSuccessfulResponse(/\/api\/v1\/niches\?archive=false$/, 'GET');
  await nichesPage.openFromSidebar();
  await activeLoaded;
  await network.mockJson(archiveEndpoint, 'GET', archiveNiches(count));
  for (const niche of archiveNiches(count)) {
    await network.mockJson(
      new RegExp(`/master/api/v1/niches/${niche.id}/data$`),
      'GET',
      archiveNicheData(niche),
    );
    await network.mockJson(new RegExp(`/master/api/v1/niches/${niche.id}$`), 'GET', niche);
  }
  await nichesPage.openArchive();
  if (count > 0) {
    await nichesPage.overview.expectListRows(Math.min(count, 10));
    await nichesPage.overview.expectRow(0, {
      name: 'Archived automation 1',
      module: 'ASO',
    });
  }
}

test.describe('Niches → Archive', () => {
  test('[TC-941] открывает архив и показывает хлебные крошки', async ({
    dashboardPage,
    network,
    nichesPage,
  }) => {
    await allure.allureId('941');
    await openArchive({ dashboardPage, network, nichesPage }, 2);
    await nichesPage.expectArchiveBreadcrumbs();
  });

  test('[TC-942] показывает структуру списка и счётчик', async ({ dashboardPage, network, nichesPage }) => {
    await allure.allureId('942');
    await openArchive({ dashboardPage, network, nichesPage }, 2);
    await nichesPage.overview.expectArchiveControls();
    await nichesPage.overview.expectRow(0, { name: 'Archived automation 1', module: 'ASO' });
  });

  test('[TC-939] показывает пустое состояние', async ({ dashboardPage, network, nichesPage }) => {
    await allure.allureId('939');
    await dashboardPage.navigate();
    await network.mockJson(archiveEndpoint, 'GET', archiveNiches(0));
    await nichesPage.navigateToArchive();
    await nichesPage.overview.expectEmpty(/No niches transferred to the archive yet/i);
  });

  test('[TC-940] завершает состояние загрузки', async ({ dashboardPage, network, nichesPage }) => {
    await allure.allureId('940');
    await dashboardPage.navigate();
    await nichesPage.openFromSidebar();
    const held = await network.holdNext(archiveEndpoint, 'GET');
    const opening = nichesPage.openArchive();
    await held.started;
    await nichesPage.expectArchiveLoading();
    await held.abort();
    await opening;
    await nichesPage.expectArchiveError();
  });

  test('[TC-943] повторяет запрос после ошибки загрузки', async ({ dashboardPage, network, nichesPage }) => {
    await allure.allureId('943');
    await dashboardPage.navigate();
    await nichesPage.openFromSidebar();
    await network.failNext(archiveEndpoint, 'GET', apiError);
    await nichesPage.openArchive();
    await nichesPage.expectArchiveError();
    await network.fulfillNextJson(archiveEndpoint, 'GET', archiveNiches(2));
    await nichesPage.repeatArchiveRequest();
    await nichesPage.overview.expectListRows(2);
  });

  test('[TC-944] ищет существующую архивную нишу', async ({ dashboardPage, network, nichesPage }) => {
    await allure.allureId('944');
    await openArchive({ dashboardPage, network, nichesPage }, 3);
    await nichesPage.overview.searchFor('Archived automation 1');
    await nichesPage.overview.expectOnlyMatchingRows('Archived automation 1');
  });

  test('[TC-945] показывает пустой поиск', async ({ dashboardPage, network, nichesPage }) => {
    await allure.allureId('945');
    await openArchive({ dashboardPage, network, nichesPage }, 3);
    await nichesPage.overview.searchFor('missing-archive-automation');
    await nichesPage.overview.expectEmpty(/No niches|Nothing was found/i);
  });

  test('[TC-979] не показывает лишнюю пагинацию до 10 строк', async ({
    dashboardPage,
    network,
    nichesPage,
  }) => {
    await allure.allureId('979');
    await openArchive({ dashboardPage, network, nichesPage }, 3);
    await nichesPage.overview.expectSinglePage(3);
  });

  test('[TC-946] переключает страницы списка более 10 строк', async ({
    dashboardPage,
    network,
    nichesPage,
  }) => {
    await allure.allureId('946');
    await openArchive({ dashboardPage, network, nichesPage }, 12);
    await nichesPage.overview.expectPagination(2);
    await nichesPage.overview.goNextAndBack();
  });

  test('[TC-947] открывает карточку архивной ниши', async ({ dashboardPage, network, nichesPage }) => {
    await allure.allureId('947');
    await openArchive({ dashboardPage, network, nichesPage }, 2);
    const snapshot = await nichesPage.overview.openFirstRow();
    await nichesPage.expectArchiveDetail(snapshot.name, snapshot.module);
    await nichesPage.expectArchiveDetailActions();
  });

  test('[TC-951] возвращает нишу в активный список', async ({ dashboardPage, network, nichesPage }) => {
    await allure.allureId('951');
    await openArchive({ dashboardPage, network, nichesPage }, 2);
    const snapshot = await nichesPage.overview.openFirstRow();
    await nichesPage.expectArchiveDetail(snapshot.name, snapshot.module);
    await network.fulfillNextMutation(mutationEndpoint, { archive: false });
    await nichesPage.moveArchivedNiche();
    await nichesPage.expectNotice('Niche has been successfully moved to niche list');
  });

  test('[TC-948] показывает ошибку возврата ниши', async ({ dashboardPage, network, nichesPage }) => {
    await allure.allureId('948');
    await openArchive({ dashboardPage, network, nichesPage }, 2);
    const snapshot = await nichesPage.overview.openFirstRow();
    await nichesPage.expectArchiveDetail(snapshot.name, snapshot.module);
    await network.fulfillNextMutation(mutationEndpoint, apiError, 500);
    await nichesPage.moveArchivedNiche();
    await nichesPage.expectNotice('Failed to move to niche list');
  });

  test('[TC-949] отменяет удаление архивной ниши', async ({ dashboardPage, network, nichesPage }) => {
    await allure.allureId('949');
    await openArchive({ dashboardPage, network, nichesPage }, 2);
    const snapshot = await nichesPage.overview.openFirstRow();
    await nichesPage.expectArchiveDetail(snapshot.name, snapshot.module);
    await nichesPage.deleteArchivedNiche(false);
    await nichesPage.expectArchiveDetail(snapshot.name, snapshot.module);
  });

  test('[TC-950] обрабатывает успешное и ошибочное удаление', async ({
    dashboardPage,
    network,
    nichesPage,
  }) => {
    await allure.allureId('950');
    await openArchive({ dashboardPage, network, nichesPage }, 2);
    const deletedNiche = await nichesPage.overview.openFirstRow();
    await nichesPage.expectArchiveDetail(deletedNiche.name, deletedNiche.module);
    await network.fulfillNextMutation(mutationEndpoint, { deleted: true });
    await nichesPage.deleteArchivedNiche(true);
    await nichesPage.expectNotice('Niche has been successfully deleted');

    await openArchive({ dashboardPage, network, nichesPage }, 2);
    const retainedNiche = await nichesPage.overview.openFirstRow();
    await nichesPage.expectArchiveDetail(retainedNiche.name, retainedNiche.module);
    await network.fulfillNextMutation(mutationEndpoint, apiError, 500);
    await nichesPage.deleteArchivedNiche(true);
    await nichesPage.expectNotice('Failed to delete niche');
    await nichesPage.expectArchiveDetail(retainedNiche.name, retainedNiche.module);
  });
});
