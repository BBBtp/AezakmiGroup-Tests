import { expect, type Response } from '@playwright/test';

import { NetworkController } from '@framework/network';
import type { KpiPage } from '@modules/kpi';

export const STAFF_KPI_API_PREFIX = '/staff/api/v1/kpi';
export const KPI_DATA_UNAVAILABLE = '[KPI_DATA_UNAVAILABLE]';

export type KpiDataRequirement = 'manager' | 'starting-score' | 'podium' | 'contenders';

export type KpiManagerStats = {
  employee_id: string;
  start_score: number | null;
};

export type KpiStatistics = {
  full_stats: KpiManagerStats[];
  score: Record<string, unknown>;
  mrr: Record<string, unknown>;
};

export type KpiDatasetAssessment = {
  managerCount: number;
  startingScoreCount: number;
};

const requiredManagers: Record<KpiDataRequirement, number> = {
  manager: 1,
  'starting-score': 1,
  podium: 3,
  contenders: 4,
};

export function assessKpiDataset(statistics: KpiStatistics): KpiDatasetAssessment {
  const managers = statistics.full_stats.filter((item) => Boolean(item.employee_id));
  return {
    managerCount: managers.length,
    startingScoreCount: managers.filter((item) => item.start_score !== null).length,
  };
}

export function hasKpiData(assessment: KpiDatasetAssessment, requirement: KpiDataRequirement): boolean {
  if (requirement === 'starting-score') return assessment.startingScoreCount > 0;
  return assessment.managerCount >= requiredManagers[requirement];
}

export function kpiDataUnavailableMessage(
  assessment: KpiDatasetAssessment,
  requirement: KpiDataRequirement,
): string {
  const required =
    requirement === 'starting-score'
      ? 'at least one manager with start_score'
      : `at least ${requiredManagers[requirement]} KPI manager(s)`;
  return `${KPI_DATA_UNAVAILABLE} requires ${required}; received managers=${assessment.managerCount}, managersWithStartScore=${assessment.startingScoreCount}`;
}

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

export async function openKpiAndGetStatistics(
  kpiPage: KpiPage,
  network: NetworkController,
): Promise<KpiStatistics> {
  const responsePromise = network.waitForResponse({
    url: (url) => url.includes(`${STAFF_KPI_API_PREFIX}/managers/statistics`),
    method: 'GET',
    timeout: 30_000,
  });
  await kpiPage.navigate();
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
