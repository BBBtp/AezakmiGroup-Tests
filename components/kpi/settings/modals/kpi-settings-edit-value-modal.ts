import { Locator, Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { KpiSettingsEditValueForm } from '../forms/kpi-settings-edit-value-form';
import { composeTestId, requireTestId } from '../../../../utils/test-id';

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

    const baseTestId = requireTestId(
      composeTestId([tableName, actionType, value]),
      'KpiSettingsEditValueModal',
    );
    this.trigger = this.locate.testId(`${baseTestId}__edit`);
    this.modal = this.locate.testId(`${baseTestId}__edit-modal`);
    this.deleteButton = this.locate.testId(`${baseTestId}__delete`);
    this.form = new KpiSettingsEditValueForm(page, tableName, actionType, value);
  }
}
