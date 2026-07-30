import { expect, type Page, type Response } from '@playwright/test';

import { UiActions } from '@framework/ui';

export const STAFF_KPI_API_PREFIX = '/staff/api/v1/kpi';

export type KpiManagerStats = {
  employee_id: string;
  start_score: number | null;
};

export type KpiStatistics = {
  full_stats: KpiManagerStats[];
  score: Record<string, unknown>;
  mrr: Record<string, unknown>;
};

export function managerKpiPath(employeeId: string, resource: string): string {
  return `${STAFF_KPI_API_PREFIX}/managers/${employeeId}/${resource}`;
}

export function managerKpiEndpoints(employeeId: string) {
  return [
    ['score history', managerKpiPath(employeeId, 'score/history')],
    ['ads history', managerKpiPath(employeeId, 'ads/history')],
    ['chart data', managerKpiPath(employeeId, 'chart-data')],
    ['diagram data', managerKpiPath(employeeId, 'diagram-data')],
    ['manager apps', `/master/api/v1/apps?param_key_ids=${employeeId}`],
  ] as const;
}

export function isKpiStatisticsResponse(response: Response): boolean {
  return (
    response.request().method() === 'GET' &&
    response.url().includes(`${STAFF_KPI_API_PREFIX}/managers/statistics?`)
  );
}

export async function openKpiAndGetStatistics(page: Page): Promise<KpiStatistics> {
  const responsePromise = page.waitForResponse(isKpiStatisticsResponse);
  await new UiActions(page).navigate('KPI page', '/kpi', { waitUntil: 'domcontentloaded' });
  const response = await responsePromise;
  await expectSuccessfulJson(response, 'KPI statistics');
  return response.json() as Promise<KpiStatistics>;
}

export async function expectSuccessfulJson(response: Response, name: string): Promise<void> {
  expect(response.status(), `${name} must return HTTP 200`).toBe(200);
  const body = await response.json();
  expect(body, `${name} must return JSON`).toBeDefined();
  expect(body).not.toHaveProperty('error');
}

export function isKpiApiRequest(url: string): boolean {
  return url.includes('/api/') && url.includes('/kpi/');
}
