import { Locator, Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiSettingsTestIds } from '@locators/kpi-settings';

export class KpiSettingsEditValueForm extends UiObject {
  readonly baseTestId: string;
  readonly root: Locator;
  readonly actionType: Locator;
  readonly valueType: Locator;
  readonly pointsRadio: Locator;
  readonly pointsRadioPlus: Locator;
  readonly pointsRadioMinus: Locator;
  readonly pointsInput: Locator;
  readonly pointsInputSign: Locator;
  readonly saveButton: Locator;
  readonly errorBlock: Locator;
  constructor(page: Page, tableName: string, actionType: string, value: string) {
    super(page);
    const testIds = kpiSettingsTestIds.row(tableName, actionType, value);
    this.baseTestId = testIds.base;
    this.root = this.locate.testId(testIds.editForm);
    this.actionType = this.locate.testId(testIds.actionType);
    this.valueType = this.locate.testId(testIds.valueType);
    this.pointsRadio = this.locate.testId(testIds.pointsRadio);
    this.pointsRadioPlus = this.locate.testId(testIds.pointsRadioPlus);
    this.pointsRadioMinus = this.locate.testId(testIds.pointsRadioMinus);
    this.pointsInput = this.locate.testId(testIds.pointsInput);
    this.pointsInputSign = this.locate.testId(testIds.pointsInputSign);
    this.saveButton = this.locate.testId(testIds.saveButton);
    this.errorBlock = this.locate.testId(testIds.error);
  }
}
