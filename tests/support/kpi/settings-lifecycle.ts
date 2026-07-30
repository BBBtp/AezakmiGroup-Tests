import type { TestDataFactory } from '@framework/data';
import type { CleanupHandle, CleanupRegistry } from '@framework/lifecycle';
import type { NetworkController } from '@framework/network';
import { KpiSettingsActionRowComponent, KpiSettingsAddValueModal, KpiSettingsPage } from '@modules/kpi';

import {
  createKpiSettingsAction,
  editKpiSettingsAction,
  failNextSettingsAction,
  pickAvailableAbTestPercent,
  pickAvailableTotalMrrReachedValue,
  registerKpiSettingsCleanup,
  waitForFailedSettingsAction,
} from './settings-actions';

export type CreateAbTestOptions = {
  points: string;
  actionType?: 'Internal test' | 'External test';
};

export type CreateTotalMrrOptions = {
  points: string;
};

export class ManagedKpiSettingsAction {
  constructor(
    readonly row: KpiSettingsActionRowComponent,
    readonly value: string,
    private readonly cleanupHandle: CleanupHandle,
    private readonly network: NetworkController,
  ) {}

  async edit(points: string): Promise<void> {
    await editKpiSettingsAction(this.row, points, this.network);
  }

  async expectEditFailure(points: string): Promise<void> {
    await this.row.openEditModal();
    await this.row.selectEditPointsType('minus');
    await this.row.fillEditPoints(points);

    await failNextSettingsAction(this.network, 'PATCH');
    const failedEdit = waitForFailedSettingsAction(this.network, 'PATCH');
    await this.row.saveEdit();
    await failedEdit;

    await this.row.expectEditModalVisible();
    await this.row.expectEditErrorVisible();
    await this.row.expectEditable();
  }

  async cancelDeletion(): Promise<void> {
    await this.row.openDeleteModal();
    await this.row.cancelDelete();
    await this.row.expectEditable();
  }

  async remove(): Promise<void> {
    await this.cleanupHandle.runNow();
    await this.row.expectDeleted();
  }
}

export class KpiSettingsLifecycle {
  constructor(
    private readonly settingsPage: KpiSettingsPage,
    private readonly cleanup: CleanupRegistry,
    private readonly dataFactory: TestDataFactory,
    private readonly network: NetworkController,
  ) {}

  async navigate(): Promise<void> {
    await this.settingsPage.navigate();
  }

  openAbTestsModal(): Promise<KpiSettingsAddValueModal> {
    return this.settingsPage.openAbTestsAddModal();
  }

  openTotalMrrModal(): Promise<KpiSettingsAddValueModal> {
    return this.settingsPage.openTotalMrrAddModal();
  }

  async expectScoreReadOnly(): Promise<void> {
    await this.settingsPage.scoreTable.expectReadOnlyShellVisible();
  }

  nextAbTestPercent(actionType: 'Internal test' | 'External test' = 'Internal test') {
    return pickAvailableAbTestPercent(this.settingsPage, this.dataFactory, actionType);
  }

  nextTotalMrrReachedValue() {
    return pickAvailableTotalMrrReachedValue(this.settingsPage, this.dataFactory);
  }

  async createAbTest({
    points,
    actionType = 'Internal test',
  }: CreateAbTestOptions): Promise<ManagedKpiSettingsAction> {
    const value = await this.nextAbTestPercent(actionType);
    const row = this.settingsPage.createAbTestRow(actionType, `Completed with ${value}% +`);
    const cleanupHandle = registerKpiSettingsCleanup(this.cleanup, this.settingsPage, row, this.network);

    await createKpiSettingsAction({
      row,
      openModal: () => this.settingsPage.openAbTestsAddModal(),
      fillModal: (modal) =>
        modal.runAbTestsAddModalFlow(actionType, 'Completed with a success over N%', value),
      createPoints: points,
      network: this.network,
    });

    return new ManagedKpiSettingsAction(row, value, cleanupHandle, this.network);
  }

  async createTotalMrr({ points }: CreateTotalMrrOptions): Promise<ManagedKpiSettingsAction> {
    const value = await this.nextTotalMrrReachedValue();
    const row = this.settingsPage.createTotalMrrRow('MRR milestones', `Reached $${value}`);
    const cleanupHandle = registerKpiSettingsCleanup(this.cleanup, this.settingsPage, row, this.network);

    await createKpiSettingsAction({
      row,
      openModal: () => this.settingsPage.openTotalMrrAddModal(),
      fillModal: (modal) => modal.runTotalMrrAddModalFlow('Change of SUM MRR', 'Reached $N', value),
      createPoints: points,
      network: this.network,
    });

    return new ManagedKpiSettingsAction(row, value, cleanupHandle, this.network);
  }

  async expectAbTestCreateFailure(points: string): Promise<void> {
    const value = await this.nextAbTestPercent();
    const row = this.settingsPage.createAbTestRow('Internal test', `Completed with ${value}% +`);
    const modal = await this.settingsPage.openAbTestsAddModal();
    await modal.runAbTestsAddModalFlow('Internal test', 'Completed with a success over N%', value);
    await this.expectCreateFailure(modal, row, points, 'POST');
  }

  async expectTotalMrrCreateFailure(points: string): Promise<void> {
    const value = await this.nextTotalMrrReachedValue();
    const row = this.settingsPage.createTotalMrrRow('MRR milestones', `Reached $${value}`);
    const modal = await this.settingsPage.openTotalMrrAddModal();
    await modal.runTotalMrrAddModalFlow('Change of SUM MRR', 'Reached $N', value);
    await this.expectCreateFailure(modal, row, points, 'POST');
  }

  private async expectCreateFailure(
    modal: KpiSettingsAddValueModal,
    row: KpiSettingsActionRowComponent,
    points: string,
    method: 'POST',
  ): Promise<void> {
    await modal.selectPointsType('plus');
    await modal.fillPoints(points);
    await failNextSettingsAction(this.network, method);
    const failedCreate = waitForFailedSettingsAction(this.network, method);
    await modal.submitCreate();
    await failedCreate;

    await modal.expectCreateErrorVisible();
    await row.expectDeleted();
  }
}
