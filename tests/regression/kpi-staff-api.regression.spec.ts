import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';
import { EmployeeCreatePage } from '@modules/employees';
import {
  expectSuccessfulJson,
  isKpiApiRequest,
  kpiAllureIds,
  managerKpiEndpoints,
  managerKpiPath,
  openKpiAndGetStatistics,
} from '@support/kpi';
import { loggedAction, loggedClick } from '@utils/playwright-logger';

test.describe('KPI staff service', () => {
  test('Основная статистика KPI возвращает стартовые баллы', async ({ kpiPage }) => {
    await allure.allureId(kpiAllureIds.statistics);

    const statistics = await openKpiAndGetStatistics(kpiPage.page);

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

  test('Карточка ASO manager загружает все KPI endpoint', async ({ kpiPage }) => {
    await allure.allureId(kpiAllureIds.managerCard);

    const statistics = await openKpiAndGetStatistics(kpiPage.page);
    const manager = statistics.full_stats.find((item) => item.employee_id);
    expect(manager, 'A KPI manager is required for this test').toBeDefined();
    const employeeId = manager!.employee_id;

    const expectedEndpoints = managerKpiEndpoints(employeeId);
    const responses = expectedEndpoints.map(([, path]) =>
      kpiPage.page.waitForResponse((response) => response.url().includes(path)),
    );

    await loggedAction(
      kpiPage.page,
      'navigate',
      `KPI manager ${employeeId}`,
      kpiPage.page.locator('body'),
      () => kpiPage.page.goto(`/kpi/${employeeId}`, { waitUntil: 'domcontentloaded' }),
    );
    const endpointResponses = await Promise.all(responses);
    await Promise.all(
      endpointResponses.map((response, index) => expectSuccessfulJson(response, expectedEndpoints[index][0])),
    );

    const vacationsResponse = kpiPage.page.waitForResponse((response) =>
      response.url().includes(managerKpiPath(employeeId, 'vacations/history')),
    );
    const settingsLink = kpiPage.page.getByRole('link', { name: 'Settings', exact: true });
    await loggedClick(kpiPage.page, 'KPI manager: open settings', settingsLink);
    await expectSuccessfulJson(await vacationsResponse, 'vacations history');
    await expect(kpiPage.page.getByText('Starting score', { exact: true }).first()).toBeVisible();
    await expect(kpiPage.page.getByText('Vacation and KPI score', { exact: true })).toBeVisible();
    await expect(
      kpiPage.page.getByText('Impact of employee vacation on minimum rating.', { exact: true }),
    ).toBeVisible();

    for (const header of ['Month', 'Starting score', 'Minimal score', 'Sufficient score', 'Vacation']) {
      await expect(kpiPage.page.getByText(header, { exact: true })).toBeVisible();
    }

    const settingsRows = kpiPage.page.getByRole('row');
    expect(await settingsRows.count()).toBeGreaterThan(1);
  });

  test('Settings отображает стартовый балл текущего месяца из API', async ({ kpiPage }) => {
    await allure.allureId(kpiAllureIds.startingScore);

    const statistics = await openKpiAndGetStatistics(kpiPage.page);
    const candidates = statistics.full_stats
      .filter((item) => item.start_score !== null)
      .sort((left, right) => Number(right.start_score !== 0) - Number(left.start_score !== 0));
    expect(candidates.length, 'A manager with start_score is required for this test').toBeGreaterThan(0);

    let verified = false;
    for (const candidate of candidates) {
      const vacationsResponse = kpiPage.page.waitForResponse((response) =>
        response.url().includes(managerKpiPath(candidate.employee_id, 'vacations/history')),
      );
      await loggedAction(
        kpiPage.page,
        'navigate',
        `KPI settings for ${candidate.employee_id}`,
        kpiPage.page.locator('body'),
        () => kpiPage.page.goto(`/kpi/${candidate.employee_id}/settings`, { waitUntil: 'domcontentloaded' }),
      );
      await expectSuccessfulJson(await vacationsResponse, 'vacations history');

      const rows = kpiPage.page.getByRole('row');
      const hasDataRows = await expect
        .poll(() => rows.count(), { timeout: 5000, intervals: [250, 500, 1000] })
        .toBeGreaterThan(1)
        .then(() => true)
        .catch(() => false);
      if (!hasDataRows) continue;

      await expect(kpiPage.page.getByText('Starting score', { exact: true }).first()).toBeVisible();
      const row = rows.nth(1);
      const displayedScore = Number((await row.getByRole('cell').nth(1).innerText()).replace(',', '.'));
      expect(displayedScore).toBe(candidate.start_score);
      verified = true;
      break;
    }

    expect(verified, 'No KPI settings row was available for managers returned by statistics').toBe(true);
  });

  test('ASO manager доступен через Employees → Create employee', async ({ kpiPage }) => {
    await allure.allureId(kpiAllureIds.asoManagerCreation);

    const employeeCreatePage = new EmployeeCreatePage(kpiPage.page);
    await employeeCreatePage.navigate();
    await employeeCreatePage.openWorkingInfo();
    await employeeCreatePage.selectAsoManagerPosition();

    await expect(employeeCreatePage.asoManagerOption).toBeVisible();
  });

  test('Все KPI API-запросы UI идут через staff service', async ({ kpiPage }) => {
    await allure.allureId(kpiAllureIds.staffServiceMigration);

    const apiRequests: string[] = [];
    kpiPage.page.on('request', (request) => {
      const url = request.url();
      if (isKpiApiRequest(url)) apiRequests.push(url);
    });

    const statistics = await openKpiAndGetStatistics(kpiPage.page);
    const manager = statistics.full_stats.find((item) => item.employee_id);
    expect(manager, 'A KPI manager is required for this test').toBeDefined();

    await kpiPage.page.goto(`/kpi/${manager!.employee_id}`, { waitUntil: 'domcontentloaded' });
    await kpiPage.page.goto(`/kpi/${manager!.employee_id}/settings`, { waitUntil: 'domcontentloaded' });
    await kpiPage.page.goto('/kpi/settings', { waitUntil: 'domcontentloaded' });

    expect(apiRequests.length, 'The KPI flow must make API requests').toBeGreaterThan(0);
    const legacyKpiRequests = apiRequests.filter((url) => !url.includes('/staff/api/'));
    expect(legacyKpiRequests, 'KPI API requests must not use the legacy service').toEqual([]);
  });

  test('Ошибка vacations history показывает error-state страницы Settings сотрудника', async ({
    kpiPage,
  }) => {
    await allure.allureId(kpiAllureIds.vacationsHistoryError);

    const statistics = await openKpiAndGetStatistics(kpiPage.page);
    const manager = statistics.full_stats.find((item) => item.employee_id);
    expect(manager, 'A KPI manager is required for this test').toBeDefined();

    const vacationPath = '**/vacations/history**';
    let vacationRequestHandled = false;
    await kpiPage.page.route(vacationPath, async (route) => {
      vacationRequestHandled = true;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Mocked vacations history error' }),
      });
    });

    await kpiPage.page.goto(`/kpi/${manager!.employee_id}/settings`, { waitUntil: 'domcontentloaded' });

    await expect.poll(() => vacationRequestHandled, { timeout: 10000 }).toBe(true);
    await expect(kpiPage.page.getByTestId('error-content')).toBeVisible();
    await expect(kpiPage.page.getByText('Vacation and KPI score', { exact: true })).toBeHidden();
  });
});
