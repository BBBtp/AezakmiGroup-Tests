import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import {
  expectSuccessfulJson,
  isKpiApiRequest,
  kpiAllureIds,
  managerKpiEndpoints,
  managerKpiPath,
  openKpiAndGetStatistics,
} from '@support/kpi';

test.describe('KPI staff service', () => {
  test('Основная статистика KPI возвращает стартовые баллы', async ({ kpiPage, network }) => {
    await allure.allureId(kpiAllureIds.statistics);

    const statistics = await openKpiAndGetStatistics(kpiPage, network);

    await test.step('Проверяем контракт statistics', async () => {
      expect(Array.isArray(statistics.full_stats)).toBe(true);
      expect(statistics.full_stats.length).toBeGreaterThan(0);
      expect(statistics.score).toBeDefined();
      expect(statistics.mrr).toBeDefined();

      for (const manager of statistics.full_stats) {
        expect(manager.employee_id).toMatch(/^[\da-f-]{36}$/i);
        expect(manager).toHaveProperty('start_score');
        expect(manager.start_score === null || Number.isFinite(manager.start_score)).toBe(true);
      }
    });
  });

  test('Карточка ASO manager загружает все KPI endpoint', async ({ kpiPage, network }) => {
    await allure.allureId(kpiAllureIds.managerCard);

    const statistics = await openKpiAndGetStatistics(kpiPage, network);
    const manager = statistics.full_stats.find((item) => item.employee_id);
    expect(manager, 'A KPI manager is required for this test').toBeDefined();
    const employeeId = manager!.employee_id;
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

  test('Settings отображает стартовый балл текущего месяца из API', async ({ kpiPage, network }) => {
    await allure.allureId(kpiAllureIds.startingScore);

    const statistics = await openKpiAndGetStatistics(kpiPage, network);
    const candidates = statistics.full_stats
      .filter((item) => item.start_score !== null)
      .sort((left, right) => Number(right.start_score !== 0) - Number(left.start_score !== 0));
    expect(candidates.length, 'A manager with start_score is required for this test').toBeGreaterThan(0);

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
      expect(displayedScore).toBe(candidate.start_score);
      verified = true;
      break;
    }

    expect(verified, 'No KPI settings row was available for managers returned by statistics').toBe(true);
  });

  test('ASO manager доступен через Employees → Create employee', async ({ employeeCreatePage }) => {
    await allure.allureId(kpiAllureIds.asoManagerCreation);

    await employeeCreatePage.navigate();
    await employeeCreatePage.openWorkingInfo();
    await employeeCreatePage.selectAsoManagerPosition();

    await employeeCreatePage.expectAsoManagerOptionVisible();
  });

  test('Все KPI API-запросы UI идут через staff service', async ({ kpiPage, network }) => {
    await allure.allureId(kpiAllureIds.staffServiceMigration);

    const apiRequests = network.captureRequests((request) => isKpiApiRequest(request.url()));

    const statistics = await openKpiAndGetStatistics(kpiPage, network);
    const manager = statistics.full_stats.find((item) => item.employee_id);
    expect(manager, 'A KPI manager is required for this test').toBeDefined();

    const managerPage = kpiPage.manager(manager!.employee_id);
    await managerPage.navigate();
    await managerPage.navigateSettings();
    await kpiPage.navigateSettings();

    apiRequests.stop();
    expect(apiRequests.urls.length, 'The KPI flow must make API requests').toBeGreaterThan(0);
    const legacyKpiRequests = apiRequests.urls.filter((url) => !url.includes('/staff/api/'));
    expect(legacyKpiRequests, 'KPI API requests must not use the legacy service').toEqual([]);
  });

  test('Ошибка vacations history показывает error-state страницы Settings сотрудника', async ({
    kpiPage,
    network,
  }) => {
    await allure.allureId(kpiAllureIds.vacationsHistoryError);

    const statistics = await openKpiAndGetStatistics(kpiPage, network);
    const manager = statistics.full_stats.find((item) => item.employee_id);
    expect(manager, 'A KPI manager is required for this test').toBeDefined();

    const vacationPath = '**/vacations/history**';
    await network.failNext(vacationPath, 'GET', { message: 'Mocked vacations history error' }, 500);
    const failedVacation = network.waitForFailedResponse('/vacations/history', 'GET');

    const managerPage = kpiPage.manager(manager!.employee_id);
    await managerPage.navigateSettings();

    await failedVacation;
    await managerPage.expectVacationError();
  });
});
