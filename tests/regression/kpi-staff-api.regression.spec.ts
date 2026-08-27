import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import {
  assessKpiDataset,
  expectSuccessfulJson,
  hasKpiData,
  isKpiApiRequest,
  kpiDataUnavailableMessage,
  kpiAllureIds,
  managerKpiEndpoints,
  managerKpiPath,
  openKpiAndGetStatistics,
} from '@support/kpi';

test.describe('KPI staff service', () => {
  test('[TC-902] Основная статистика KPI возвращает стартовые баллы', async ({ kpiPage, network }) => {
    await allure.allureId(kpiAllureIds.statistics);

    const statistics = await openKpiAndGetStatistics(kpiPage, network);
    const dataset = assessKpiDataset(statistics);

    await test.step('ПРОВЕРКА · Контракт statistics содержит обязательные KPI-поля', async () => {
      await scenarioCheck.isTrue(
        'statistics.full_stats является массивом',
        Array.isArray(statistics.full_stats),
      );
      await scenarioCheck.greaterThan(
        kpiDataUnavailableMessage(dataset, 'manager'),
        statistics.full_stats.length,
        0,
      );
      await scenarioCheck.defined('statistics содержит score', statistics.score);
      await scenarioCheck.defined('statistics содержит mrr', statistics.mrr);

      for (const manager of statistics.full_stats) {
        await scenarioCheck.matches('employee_id соответствует UUID', manager.employee_id, /^[\da-f-]{36}$/i);
        await scenarioCheck.hasProperty('Статистика менеджера содержит start_score', manager, 'start_score');
        await scenarioCheck.isTrue(
          'start_score равен null или конечному числу',
          manager.start_score === null || Number.isFinite(manager.start_score),
        );
      }
    });
  });

  test('[TC-903] Карточка ASO manager загружает все KPI endpoint', async ({ kpiPage, network }) => {
    await allure.allureId(kpiAllureIds.managerCard);

    const statistics = await openKpiAndGetStatistics(kpiPage, network);
    const dataset = assessKpiDataset(statistics);
    test.skip(!hasKpiData(dataset, 'manager'), kpiDataUnavailableMessage(dataset, 'manager'));
    const manager = await scenarioCheck.requireDefined(
      'Для проверки доступен KPI manager',
      statistics.full_stats.find((item) => item.employee_id),
    );
    const employeeId = manager.employee_id;
    const managerPage = kpiPage.manager(employeeId);

    const expectedEndpoints = managerKpiEndpoints(employeeId);
    const responses = expectedEndpoints.map(([, path]) => network.waitForResponse({ url: path }));

    await managerPage.navigate();
    const endpointResponses = await Promise.all(responses);
    await Promise.all(
      endpointResponses.map((response, index) => expectSuccessfulJson(response, expectedEndpoints[index][0])),
    );

    const vacationsResponse = network.waitForResponse({
      url: managerKpiPath(employeeId, 'vacations/history'),
    });
    await managerPage.openSettings();
    await expectSuccessfulJson(await vacationsResponse, 'vacations history');
    await managerPage.expectSettingsContent();
  });

  test('[TC-904] Settings отображает стартовый балл текущего месяца из API', async ({ kpiPage, network }) => {
    await allure.allureId(kpiAllureIds.startingScore);

    const statistics = await openKpiAndGetStatistics(kpiPage, network);
    const dataset = assessKpiDataset(statistics);
    test.skip(!hasKpiData(dataset, 'starting-score'), kpiDataUnavailableMessage(dataset, 'starting-score'));
    const candidates = statistics.full_stats
      .filter((item) => item.start_score !== null)
      .sort((left, right) => Number(right.start_score !== 0) - Number(left.start_score !== 0));
    await scenarioCheck.greaterThan('Доступен manager со start_score', candidates.length, 0);

    let verified = false;
    for (const candidate of candidates) {
      const vacationsResponse = network.waitForResponse({
        url: managerKpiPath(candidate.employee_id, 'vacations/history'),
      });
      const managerPage = kpiPage.manager(candidate.employee_id);
      await managerPage.navigateSettings();
      await expectSuccessfulJson(await vacationsResponse, 'vacations history');

      const displayedScore = await managerPage.readStartingScore();
      if (displayedScore === null) continue;
      await scenarioCheck.equal(
        'Settings отображает start_score manager',
        displayedScore,
        candidate.start_score,
      );
      verified = true;
      break;
    }

    await scenarioCheck.isTrue('Для manager из statistics найдена строка KPI Settings', verified);
  });

  test('[TC-899] ASO manager доступен через Employees → Create employee', async ({ employeeCreatePage }) => {
    await allure.allureId(kpiAllureIds.asoManagerCreation);

    await employeeCreatePage.navigate();
    await employeeCreatePage.openWorkingInfo();
    await employeeCreatePage.selectAsoManagerPosition();

    await employeeCreatePage.expectAsoManagerOptionVisible();
  });

  test('[TC-911] Все KPI API-запросы UI идут через staff service', async ({ kpiPage, network }) => {
    await allure.allureId(kpiAllureIds.staffServiceMigration);

    const apiRequests = network.captureRequests((request) => isKpiApiRequest(request.url()));

    const statistics = await openKpiAndGetStatistics(kpiPage, network);
    const dataset = assessKpiDataset(statistics);
    test.skip(!hasKpiData(dataset, 'manager'), kpiDataUnavailableMessage(dataset, 'manager'));
    const manager = await scenarioCheck.requireDefined(
      'Для проверки доступен KPI manager',
      statistics.full_stats.find((item) => item.employee_id),
    );

    const managerPage = kpiPage.manager(manager.employee_id);
    await managerPage.navigate();
    await managerPage.navigateSettings();
    await kpiPage.navigateSettings();

    apiRequests.stop();
    await scenarioCheck.greaterThan('KPI flow отправляет API-запросы', apiRequests.urls.length, 0);
    const legacyKpiRequests = apiRequests.urls.filter((url) => !url.includes('/staff/api/'));
    await scenarioCheck.deepEqual('KPI API-запросы используют только staff service', legacyKpiRequests, []);
  });

  test('[TC-908] Ошибка vacations history показывает error-state страницы Settings сотрудника', async ({
    kpiPage,
    network,
  }) => {
    await allure.allureId(kpiAllureIds.vacationsHistoryError);

    const statistics = await openKpiAndGetStatistics(kpiPage, network);
    const dataset = assessKpiDataset(statistics);
    test.skip(!hasKpiData(dataset, 'manager'), kpiDataUnavailableMessage(dataset, 'manager'));
    const manager = await scenarioCheck.requireDefined(
      'Для проверки доступен KPI manager',
      statistics.full_stats.find((item) => item.employee_id),
    );

    const vacationPath = '**/vacations/history**';
    await network.failNext(vacationPath, 'GET', { message: 'Mocked vacations history error' }, 500);
    const failedVacation = network.waitForFailedResponse('/vacations/history', 'GET');

    const managerPage = kpiPage.manager(manager.employee_id);
    await managerPage.navigateSettings();

    await failedVacation;
    await managerPage.expectVacationError();
  });
});
