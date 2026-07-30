import { Locator, Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiSettingsTestIds } from '@locators/kpi-settings';
import { KpiSettingsEditValueForm } from '../forms/kpi-settings-edit-value-form';

export class KpiSettingsEditValueModal extends UiObject {
  readonly tableName: string;
  readonly actionType: string;
  readonly value: string;

  readonly trigger: Locator;
  readonly modal: Locator;
  readonly form: KpiSettingsEditValueForm;
  readonly deleteButton: Locator;

  constructor(page: Page, tableName: string, actionType: string, value: string) {
    super(page);
    this.tableName = tableName;
    this.actionType = actionType;
    this.value = value;

    const testIds = kpiSettingsTestIds.row(tableName, actionType, value);
    this.trigger = this.locate.testId(testIds.editButton);
    this.modal = this.locate.testId(testIds.editModal);
    this.deleteButton = this.locate.testId(testIds.deleteButton);
    this.form = new KpiSettingsEditValueForm(page, tableName, actionType, value);
  }
}
