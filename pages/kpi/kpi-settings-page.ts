import { type Page, type Locator, expect } from '@playwright/test';
import { kpiTestIds } from '@locators/kpi';
import { BasePage } from '../base-page';
import { KpiSettingsScoreComponent } from '../../components/kpi/settings/kpi-settings-score-component';
import { KpiSettingsTableComponent } from '../../components/kpi/settings/kpi-settings-table-component';
import {
  KpiSettingsAddValueModal,
  KpiSettingsAddValueTableName,
} from '../../components/kpi/settings/modals/kpi-settings-add-value-modal';
import { KpiSettingsActionRowComponent } from '../../components/kpi/settings/kpi-settings-action-row-component';
import { KpiSettingsDeleteValueModal } from '../../components/kpi/settings/modals/kpi-settings-delete-value-modal';

export class KpiSettingsPage extends BasePage {
  readonly root: Locator;
  readonly loadingState: Locator;
  readonly errorContent: Locator;
  readonly breadcrumbs: Locator;
  readonly scoreTable: KpiSettingsScoreComponent;
  readonly abTestsTable: KpiSettingsTableComponent;
  readonly totalMrrTable: KpiSettingsTableComponent;
  readonly abTestsAddModal: KpiSettingsAddValueModal;
  readonly totalMrrAddModal: KpiSettingsAddValueModal;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(kpiTestIds.settings.page);
    this.loadingState = this.locate.testId(kpiTestIds.settings.loading);
    this.errorContent = this.locate.testId(kpiTestIds.errorContent);
    this.breadcrumbs = this.locate.testId(kpiTestIds.settings.breadcrumbs);
    this.scoreTable = new KpiSettingsScoreComponent(page);
    this.abTestsTable = new KpiSettingsTableComponent(page, 'ab-tests');
    this.totalMrrTable = new KpiSettingsTableComponent(page, 'total-mrr');
    this.abTestsAddModal = new KpiSettingsAddValueModal(page, 'ab-tests');
    this.totalMrrAddModal = new KpiSettingsAddValueModal(page, 'total-mrr');
  }

  private getTable(tableName: KpiSettingsAddValueTableName): KpiSettingsTableComponent {
    return tableName === 'ab-tests' ? this.abTestsTable : this.totalMrrTable;
  }

  createAbTestRow(actionType: string, value: string): KpiSettingsActionRowComponent {
    return this.abTestsTable.createActionRow(actionType, value);
  }

  createTotalMrrRow(actionType: string, value: string): KpiSettingsActionRowComponent {
    return this.totalMrrTable.createActionRow(actionType, value);
  }

  createDeleteModal(
    tableName: 'ab-tests' | 'total-mrr',
    actionType: string,
    value: string,
  ): KpiSettingsDeleteValueModal {
    return new KpiSettingsDeleteValueModal(this.page, tableName, actionType, value);
  }

  async openAddModal(tableName: KpiSettingsAddValueTableName): Promise<KpiSettingsAddValueModal> {
    const table = this.getTable(tableName);
    return table.openAddModal();
  }

  async openAbTestsAddModal(): Promise<KpiSettingsAddValueModal> {
    return this.abTestsTable.openAddModal();
  }

  async openTotalMrrAddModal(): Promise<KpiSettingsAddValueModal> {
    return this.totalMrrTable.openAddModal();
  }

  async navigate(): Promise<void> {
    await this.navigateTo('/kpi/settings');
    await this.waitForPageLoad();
  }

  async expectShellVisible(): Promise<void> {
    await expect(this.page).toHaveURL(/\/kpi\/settings/);
    await expect(this.root).toBeVisible();
    await expect(this.loadingState).toBeHidden();
    await expect(this.breadcrumbs.first()).toBeVisible();
    await this.scoreTable.expectShellVisible();
  }

  async expectBaseTablesVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
    await this.scoreTable.expectShellVisible();
    await this.abTestsTable.expectEditableShellVisible();
    await this.totalMrrTable.expectEditableShellVisible();
  }

  async waitForPageLoad(): Promise<void> {
    await this.waitForLoad();
    await expect(this.root).toBeVisible();
    await expect(this.loadingState).toBeHidden({ timeout: 15000 });
  }
}
