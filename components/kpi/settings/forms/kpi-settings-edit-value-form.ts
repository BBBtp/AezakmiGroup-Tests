import { Locator, Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { composeTestId, requireTestId } from '../../../../utils/test-id';

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
    this.baseTestId = requireTestId(
      composeTestId([tableName, actionType, value]),
      'KpiSettingsEditValueForm',
    );
    this.root = this.locate.testId(`${this.baseTestId}__edit-form`);
    this.actionType = this.locate.testId(`${this.baseTestId}__actionType`);
    this.valueType = this.locate.testId(`${this.baseTestId}__valueType`);
    this.pointsRadio = this.locate.testId(`${this.baseTestId}__points-radio`);
    this.pointsRadioPlus = this.locate.testId(`${this.baseTestId}__points-radio__plus`);
    this.pointsRadioMinus = this.locate.testId(`${this.baseTestId}__points-radio__minus`);
    this.pointsInput = this.locate.testId(`${this.baseTestId}__points-input`);
    this.pointsInputSign = this.locate.testId(`${this.baseTestId}__points-input-sign`);
    this.saveButton = this.locate.testId(`${this.baseTestId}__save`);
    this.errorBlock = this.locate.testId(`${this.baseTestId}__error`);
  }
}
