import { type Page, type Locator, expect } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { KpiSettingsActionRowComponent } from './kpi-settings-action-row-component';
import {
  KpiSettingsAddValueModal,
  KpiSettingsAddValueTableName,
} from './modals/kpi-settings-add-value-modal';
import { requireTestId } from '../../../utils/test-id';

export type KpiSettingsTableOptions = {
  hasValueColumn?: boolean;
  hasFooterBar?: boolean;
};

export class KpiSettingsTableComponent extends UiObject {
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
    super(page);
    this.tableName = requireTestId(tableName, 'KpiSettingsTableComponent');
    this.options = {
      hasValueColumn: options.hasValueColumn ?? true,
      hasFooterBar: options.hasFooterBar ?? true,
    };
    this.root = this.locate.testId(this.tableName);
    this.table = this.locate.testId(`${this.tableName}__table`);
    this.headerRow = this.locate.testId(`${this.tableName}__table-header-row`);
    this.actionTypeHeader = this.locate.testId(`${this.tableName}__action-type-header`);
    this.pointsHeader = this.locate.testId(`${this.tableName}__points-header`);
    this.pointsLabel = this.locate.testId(`${this.tableName}__points-label`);
    this.tableBody = this.locate.testId(`${this.tableName}__table-body`);

    if (this.options.hasValueColumn) {
      this.valueHeader = this.locate.testId(`${this.tableName}__value-header`);
    }

    if (this.options.hasFooterBar) {
      this.footerBar = this.locate.testId(`${this.tableName}__table-bar`);
    }

    this.addValueButton = this.locate.testId(`${this.tableName}__add-value`);
    this.addModal = this.locate.testId(`${this.tableName}__add-modal`);
    this.addForm = this.locate.testId(`${this.tableName}__add-form`);
    this.addModalStepActionType = this.locate.testId(`${this.tableName}-Action type`);
    this.addModalStepValue = this.locate.testId(`${this.tableName}-Value`);
    this.addModalStepPoints = this.locate.testId(`${this.tableName}-Points`);
    this.addModalPrevButton = this.locate.testId(`${this.tableName}__button-prev`);
    this.addModalNextButton = this.locate.testId(`${this.tableName}__button-next`);
    this.addModalLoading = this.locate.testId(`${this.tableName}__loading`);
    this.addModalError = this.locate.testId(`${this.tableName}__error`);
  }

  createActionRow(actionType: string, value: string): KpiSettingsActionRowComponent {
    return new KpiSettingsActionRowComponent(this.page, this.tableName, actionType, value);
  }

  async listEditButtonTestIds(prefix: string): Promise<string[]> {
    return this.locate
      .within(this.root)
      .css(`[data-testid^="${prefix}"][data-testid$="__edit"]`)
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid') ?? ''));
  }

  async openAddModal(): Promise<KpiSettingsAddValueModal> {
    await this.actions.click(`KPI settings: add value ${this.tableName}`, this.addValueButton);

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
