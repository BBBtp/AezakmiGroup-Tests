import { Page, Locator, expect } from '@playwright/test';
import { KpiSettingsActionRowComponent } from './kpi-settings-action-row-component';
import {
  KpiSettingsAddValueModal,
  KpiSettingsAddValueTableName,
} from './modals/kpi-settings-add-value-modal';
import { requireTestId } from '../../../utils/test-id';
import { loggedClick } from '../../../utils/playwright-logger';

export type KpiSettingsTableOptions = {
  hasValueColumn?: boolean;
  hasFooterBar?: boolean;
};

export class KpiSettingsTableComponent {
  readonly page: Page;
  readonly tableName: string;
  readonly root: Locator;
  readonly table: Locator;
  readonly headerRow: Locator;
  readonly actionTypeHeader: Locator;
  readonly pointsHeader: Locator;
  readonly valueHeader?: Locator;
  readonly pointsLabel: Locator;
  readonly tableBody: Locator;
  readonly footerBar?: Locator;
  readonly addValueButton: Locator;
  readonly addModal: Locator;
  readonly addForm: Locator;
  readonly addModalStepActionType: Locator;
  readonly addModalStepValue: Locator;
  readonly addModalStepPoints: Locator;
  readonly addModalPrevButton: Locator;
  readonly addModalNextButton: Locator;
  readonly addModalLoading: Locator;
  readonly addModalError: Locator;
  private readonly options: Required<KpiSettingsTableOptions>;

  constructor(page: Page, tableName: string, options: KpiSettingsTableOptions = {}) {
    this.page = page;
    this.tableName = requireTestId(tableName, 'KpiSettingsTableComponent');
    this.options = {
      hasValueColumn: options.hasValueColumn ?? true,
      hasFooterBar: options.hasFooterBar ?? true,
    };
    this.root = page.locator(`[data-testid="${this.tableName}"]`);
    this.table = page.locator(`[data-testid="${this.tableName}__table"]`);
    this.headerRow = page.locator(`[data-testid="${this.tableName}__table-header-row"]`);
    this.actionTypeHeader = page.locator(`[data-testid="${this.tableName}__action-type-header"]`);
    this.pointsHeader = page.locator(`[data-testid="${this.tableName}__points-header"]`);
    this.pointsLabel = page.locator(`[data-testid="${this.tableName}__points-label"]`);
    this.tableBody = page.locator(`[data-testid="${this.tableName}__table-body"]`);

    if (this.options.hasValueColumn) {
      this.valueHeader = page.locator(`[data-testid="${this.tableName}__value-header"]`);
    }

    if (this.options.hasFooterBar) {
      this.footerBar = page.locator(`[data-testid="${this.tableName}__table-bar"]`);
    }

    this.addValueButton = page.locator(`[data-testid="${this.tableName}__add-value"]`);
    this.addModal = page.locator(`[data-testid="${this.tableName}__add-modal"]`);
    this.addForm = page.locator(`[data-testid="${this.tableName}__add-form"]`);
    this.addModalStepActionType = page.locator(`[data-testid="${this.tableName}-Action type"]`);
    this.addModalStepValue = page.locator(`[data-testid="${this.tableName}-Value"]`);
    this.addModalStepPoints = page.locator(`[data-testid="${this.tableName}-Points"]`);
    this.addModalPrevButton = page.locator(`[data-testid="${this.tableName}__button-prev"]`);
    this.addModalNextButton = page.locator(`[data-testid="${this.tableName}__button-next"]`);
    this.addModalLoading = page.locator(`[data-testid="${this.tableName}__loading"]`);
    this.addModalError = page.locator(`[data-testid="${this.tableName}__error"]`);
  }

  createActionRow(actionType: string, value: string): KpiSettingsActionRowComponent {
    return new KpiSettingsActionRowComponent(this.page, this.tableName, actionType, value);
  }

  async openAddModal(): Promise<KpiSettingsAddValueModal> {
    await loggedClick(this.page, `KPI settings: add value ${this.tableName}`, this.addValueButton);

    const modal = new KpiSettingsAddValueModal(this.page, this.tableName as KpiSettingsAddValueTableName);
    await modal.waitForOpen();
    return modal;
  }

  async expectShellVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.table).toBeVisible();
    await expect(this.headerRow).toBeVisible();
    await expect(this.actionTypeHeader).toBeVisible();
    await expect(this.pointsHeader).toBeVisible();
    await expect(this.tableBody).toBeVisible();

    if (this.options.hasValueColumn) {
      await this.expectValueHeaderVisible();
    }

    if (this.options.hasFooterBar && this.footerBar) {
      await expect(this.footerBar).toBeVisible();
    }
  }

  async expectEditableShellVisible(): Promise<void> {
    await this.expectShellVisible();
    await expect(this.addValueButton).toBeVisible();
  }

  async expectValueHeaderVisible(): Promise<void> {
    if (!this.valueHeader) {
      throw new Error(`${this.tableName} table does not have a value column`);
    }

    await expect(this.valueHeader).toBeVisible();
  }
}
