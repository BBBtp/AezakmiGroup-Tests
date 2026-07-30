import { Locator, Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiSettingsTestIds } from '@locators/kpi-settings';

export class KpiSettingsDeleteValueModal extends UiObject {
  readonly baseTestId: string;

  readonly modal: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly loader: Locator;

  constructor(page: Page, tableName: string, actionType: string, value: string) {
    super(page);
    const testIds = kpiSettingsTestIds.row(tableName, actionType, value);
    this.baseTestId = testIds.base;
    this.modal = this.locate.testId(testIds.deleteModal);
    this.confirmButton = this.locate.testId(kpiSettingsTestIds.deleteConfirm);
    this.cancelButton = this.locate.testId(kpiSettingsTestIds.deleteCancel);
    this.loader = this.locate.testId(kpiSettingsTestIds.deleteLoader);
  }
}
