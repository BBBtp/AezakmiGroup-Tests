import type { TestDataFactory } from '@framework/data';
import type { CleanupHandle, CleanupRegistry } from '@framework/lifecycle';
import type { NetworkController } from '@framework/network';

import { KpiSettingsActionRowComponent, KpiSettingsAddValueModal, KpiSettingsPage } from '@modules/kpi';
import { STAFF_KPI_API_PREFIX } from './staff-service';

export type KpiSettingsActionMethod = 'POST' | 'PATCH' | 'DELETE';

type CreateKpiSettingsActionOptions = {
  row: KpiSettingsActionRowComponent;
  openModal: () => Promise<KpiSettingsAddValueModal>;
  fillModal: (modal: KpiSettingsAddValueModal) => Promise<void>;
  createPoints: string;
  network: NetworkController;
};

const settingsActionsPath = `${STAFF_KPI_API_PREFIX}/managers/settings/actions`;

export async function pickAvailableAbTestPercent(
  settingsPage: KpiSettingsPage,
  dataFactory: TestDataFactory,
  actionType = 'Internal test',
): Promise<string> {
  const existingIds = await settingsPage.abTestsTable.listEditButtonTestIds(
    `ab-tests__${actionType}__Completed with `,
  );

  const occupied = existingIds
    .map((id) => id.match(/Completed with (\d+)% \+__edit$/)?.[1])
    .filter((value): value is string => Boolean(value));
  return String(dataFactory.firstAvailableNumber(occupied, { min: 31, max: 99 }));
}

export async function pickAvailableTotalMrrReachedValue(
  settingsPage: KpiSettingsPage,
  dataFactory: TestDataFactory,
): Promise<string> {
  const existingIds = await settingsPage.totalMrrTable.listEditButtonTestIds(
    'total-mrr__MRR milestones__Reached $',
  );
  const existingValues = new Set(
    existingIds
      .map((id) => id.match(/total-mrr__MRR milestones__Reached \$\s?(\d+)__edit$/)?.[1])
      .filter((value): value is string => Boolean(value)),
  );

  return String(dataFactory.firstAvailableNumber(existingValues, { min: 30001, max: 99999 }));
}

export function waitForSettingsAction(network: NetworkController, method: KpiSettingsActionMethod) {
  return network.waitForSuccessfulResponse(settingsActionsPath, method);
}

export function waitForFailedSettingsAction(network: NetworkController, method: KpiSettingsActionMethod) {
  return network.waitForFailedResponse(settingsActionsPath, method);
}

export async function failNextSettingsAction(
  network: NetworkController,
  method: KpiSettingsActionMethod,
): Promise<void> {
  const urlPattern = method === 'POST' ? `**${settingsActionsPath}` : `**${settingsActionsPath}/**`;
  await network.failNext(urlPattern, method, { message: 'Mocked KPI settings action error' });
}

async function runAndWaitForSettingsAction(
  network: NetworkController,
  method: KpiSettingsActionMethod,
  action: () => Promise<void>,
): Promise<void> {
  const responsePromise = waitForSettingsAction(network, method);
  await action();
  await responsePromise;
}

export function registerKpiSettingsCleanup(
  cleanup: CleanupRegistry,
  settingsPage: KpiSettingsPage,
  row: KpiSettingsActionRowComponent,
  network: NetworkController,
): CleanupHandle {
  return cleanup.register(`KPI settings row ${row.tableName}/${row.actionType}/${row.value}`, () =>
    deleteKpiSettingsActionIfPresent(settingsPage, row, network),
  );
}

export async function createKpiSettingsAction({
  row,
  openModal,
  fillModal,
  createPoints,
  network,
}: CreateKpiSettingsActionOptions): Promise<void> {
  const modal = await openModal();
  await fillModal(modal);
  await modal.selectPointsType('plus');
  await modal.fillPoints(createPoints);

  await runAndWaitForSettingsAction(network, 'POST', () => modal.submitCreate());
  await row.expectEditable();
}

export async function editKpiSettingsAction(
  row: KpiSettingsActionRowComponent,
  points: string,
  network: NetworkController,
): Promise<void> {
  await row.openEditModal();
  await row.selectEditPointsType('minus');
  await row.fillEditPoints(points);
  await runAndWaitForSettingsAction(network, 'PATCH', () => row.saveEdit());
  await row.expectEditModalHidden();
}

export async function deleteKpiSettingsActionIfPresent(
  settingsPage: KpiSettingsPage,
  row: KpiSettingsActionRowComponent,
  network: NetworkController,
): Promise<void> {
  await settingsPage.navigate();

  if ((await row.deleteButton.count()) === 0 || !(await row.deleteButton.isEnabled())) return;

  await row.openDeleteModal();
  await runAndWaitForSettingsAction(network, 'DELETE', () => row.confirmDelete());
  await row.expectDeleted();
}
