import type { Route } from '@playwright/test';
import type { CleanupHandle, CleanupRegistry } from '@framework/lifecycle';

import { KpiSettingsActionRowComponent, KpiSettingsAddValueModal, KpiSettingsPage } from '@modules/kpi';
import { STAFF_KPI_API_PREFIX } from './staff-service';

export type KpiSettingsActionMethod = 'POST' | 'PATCH' | 'DELETE';

type CreateKpiSettingsActionOptions = {
  settingsPage: KpiSettingsPage;
  row: KpiSettingsActionRowComponent;
  openModal: () => Promise<KpiSettingsAddValueModal>;
  fillModal: (modal: KpiSettingsAddValueModal) => Promise<void>;
  createPoints: string;
  cleanup?: CleanupRegistry;
};

type CreateEditDeleteKpiSettingsActionOptions = CreateKpiSettingsActionOptions & {
  editPoints: string;
};

const settingsActionsPath = `${STAFF_KPI_API_PREFIX}/managers/settings/actions`;

export async function pickAvailableAbTestPercent(
  settingsPage: KpiSettingsPage,
  actionType = 'Internal test',
): Promise<string> {
  const existingIds = await settingsPage.abTestsTable.listEditButtonTestIds(
    `ab-tests__${actionType}__Completed with `,
  );

  for (let value = 31; value < 100; value++) {
    const expectedId = `ab-tests__${actionType}__Completed with ${value}% +__edit`;
    if (!existingIds.includes(expectedId)) return String(value);
  }

  throw new Error('No free A/B test percentage value found for KPI Settings regression');
}

export async function pickAvailableTotalMrrReachedValue(settingsPage: KpiSettingsPage): Promise<string> {
  const existingIds = await settingsPage.totalMrrTable.listEditButtonTestIds(
    'total-mrr__MRR milestones__Reached $',
  );
  const existingValues = new Set(
    existingIds
      .map((id) => id.match(/total-mrr__MRR milestones__Reached \$\s?(\d+)__edit$/)?.[1])
      .filter((value): value is string => Boolean(value)),
  );

  for (let value = 30001; value < 100000; value++) {
    if (!existingValues.has(String(value))) return String(value);
  }

  throw new Error('No free Total MRR reached value found for KPI Settings regression');
}

export function waitForSettingsAction(settingsPage: KpiSettingsPage, method: KpiSettingsActionMethod) {
  return settingsPage.page.waitForResponse(
    (response) =>
      response.request().method() === method &&
      response.url().includes(settingsActionsPath) &&
      response.status() >= 200 &&
      response.status() < 300,
  );
}

export function waitForFailedSettingsAction(settingsPage: KpiSettingsPage, method: KpiSettingsActionMethod) {
  return settingsPage.page.waitForResponse(
    (response) =>
      response.request().method() === method &&
      response.url().includes(settingsActionsPath) &&
      response.status() >= 500,
  );
}

export async function failNextSettingsAction(
  settingsPage: KpiSettingsPage,
  method: KpiSettingsActionMethod,
): Promise<void> {
  const urlPattern = method === 'POST' ? `**${settingsActionsPath}` : `**${settingsActionsPath}/**`;
  const handler = async (route: Route) => {
    if (route.request().method() !== method) return route.continue();

    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Mocked KPI settings action error' }),
    });
  };

  await settingsPage.page.route(urlPattern, handler, { times: 1 });
}

async function runAndWaitForSettingsAction(
  settingsPage: KpiSettingsPage,
  method: KpiSettingsActionMethod,
  action: () => Promise<void>,
): Promise<void> {
  const responsePromise = waitForSettingsAction(settingsPage, method);
  await action();
  await responsePromise;
}

export async function createEditDeleteKpiSettingsAction({
  settingsPage,
  row,
  openModal,
  fillModal,
  createPoints,
  editPoints,
  cleanup,
}: CreateEditDeleteKpiSettingsActionOptions): Promise<void> {
  const cleanupHandle = cleanup ? registerKpiSettingsCleanup(cleanup, settingsPage, row) : undefined;
  try {
    await createKpiSettingsAction({ settingsPage, row, openModal, fillModal, createPoints });

    await row.openEditModal();
    await row.selectEditPointsType('minus');
    await row.fillEditPoints(editPoints);
    await runAndWaitForSettingsAction(settingsPage, 'PATCH', () => row.saveEdit());
    await row.expectEditModalHidden();
  } finally {
    await deleteKpiSettingsActionIfPresent(settingsPage, row);
    cleanupHandle?.dismiss();
  }

  await row.expectDeleted();
}

export function registerKpiSettingsCleanup(
  cleanup: CleanupRegistry,
  settingsPage: KpiSettingsPage,
  row: KpiSettingsActionRowComponent,
): CleanupHandle {
  return cleanup.register(`KPI settings row ${row.tableName}/${row.actionType}/${row.value}`, () =>
    deleteKpiSettingsActionIfPresent(settingsPage, row),
  );
}

export async function createKpiSettingsAction({
  settingsPage,
  row,
  openModal,
  fillModal,
  createPoints,
}: CreateKpiSettingsActionOptions): Promise<void> {
  const modal = await openModal();
  await fillModal(modal);
  await modal.selectPointsType('plus');
  await modal.fillPoints(createPoints);

  await runAndWaitForSettingsAction(settingsPage, 'POST', () => modal.submitCreate());
  await row.expectEditable();
}

export async function deleteKpiSettingsActionIfPresent(
  settingsPage: KpiSettingsPage,
  row: KpiSettingsActionRowComponent,
): Promise<void> {
  await settingsPage.page.goto('/kpi/settings');
  await settingsPage.waitForPageLoad();

  if ((await row.deleteButton.count()) === 0 || !(await row.deleteButton.isEnabled())) return;

  await row.openDeleteModal();
  await runAndWaitForSettingsAction(settingsPage, 'DELETE', () => row.confirmDelete());
}
