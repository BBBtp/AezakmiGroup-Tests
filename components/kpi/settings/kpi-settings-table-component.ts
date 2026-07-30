import { type Page, type Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiSettingsTestIds } from '@locators/kpi-settings';
import { KpiSettingsActionRowComponent } from './kpi-settings-action-row-component';
import {
  KpiSettingsAddValueModal,
  KpiSettingsAddValueTableName,
} from './modals/kpi-settings-add-value-modal';

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
    const testIds = kpiSettingsTestIds.table(tableName);
    this.tableName = testIds.root;
    this.options = {
      hasValueColumn: options.hasValueColumn ?? true,
      hasFooterBar: options.hasFooterBar ?? true,
    };
    this.root = this.locate.testId(testIds.root);
    this.table = this.locate.testId(testIds.table);
    this.headerRow = this.locate.testId(testIds.headerRow);
    this.actionTypeHeader = this.locate.testId(testIds.actionTypeHeader);
    this.pointsHeader = this.locate.testId(testIds.pointsHeader);
    this.pointsLabel = this.locate.testId(testIds.pointsLabel);
    this.tableBody = this.locate.testId(testIds.body);

    if (this.options.hasValueColumn) {
      this.valueHeader = this.locate.testId(testIds.valueHeader);
    }

    if (this.options.hasFooterBar) {
      this.footerBar = this.locate.testId(testIds.footer);
    }

    const modalTestIds = kpiSettingsTestIds.addModal(this.tableName);
    this.addValueButton = this.locate.testId(testIds.addValue);
    this.addModal = this.locate.testId(modalTestIds.root);
    this.addForm = this.locate.testId(kpiSettingsTestIds.addForm(this.tableName).root);
    this.addModalStepActionType = this.locate.testId(modalTestIds.actionTypeStep);
    this.addModalStepValue = this.locate.testId(modalTestIds.valueStep);
    this.addModalStepPoints = this.locate.testId(modalTestIds.pointsStep);
    this.addModalPrevButton = this.locate.testId(modalTestIds.backButton);
    this.addModalNextButton = this.locate.testId(modalTestIds.nextButton);
    this.addModalLoading = this.locate.testId(modalTestIds.loading);
    this.addModalError = this.locate.testId(modalTestIds.error);
  }

  createActionRow(actionType: string, value: string): KpiSettingsActionRowComponent {
    return new KpiSettingsActionRowComponent(this.page, this.tableName, actionType, value);
  }

  async listEditButtonTestIds(prefix: string): Promise<string[]> {
    const testIds = kpiSettingsTestIds.table(this.tableName);
    return this.locate
      .within(this.root)
      .css(testIds.editButtonPattern(prefix))
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid') ?? ''));
  }

  async openAddModal(): Promise<KpiSettingsAddValueModal> {
    await this.actions.click(`KPI settings: add value ${this.tableName}`, this.addValueButton);

    const modal = new KpiSettingsAddValueModal(this.page, this.tableName as KpiSettingsAddValueTableName);
    await modal.waitForOpen();
    return modal;
  }

  async expectShellVisible(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: root`, this.root);
    await this.expectations.visible(`${this.tableName}: table`, this.table);
    await this.expectations.visible(`${this.tableName}: header row`, this.headerRow);
    await this.expectations.visible(`${this.tableName}: action type header`, this.actionTypeHeader);
    await this.expectations.visible(`${this.tableName}: points header`, this.pointsHeader);
    await this.expectations.visible(`${this.tableName}: body`, this.tableBody);

    if (this.options.hasValueColumn) {
      await this.expectValueHeaderVisible();
    }

    if (this.options.hasFooterBar && this.footerBar) {
      await this.expectations.visible(`${this.tableName}: footer`, this.footerBar);
    }
  }

  async expectEditableShellVisible(): Promise<void> {
    await this.expectShellVisible();
    await this.expectations.visible(`${this.tableName}: add value`, this.addValueButton);
  }

  async expectValueHeaderVisible(): Promise<void> {
    if (!this.valueHeader) {
      throw new Error(`${this.tableName} table does not have a value column`);
    }

    await this.expectations.visible(`${this.tableName}: value header`, this.valueHeader);
  }
}
