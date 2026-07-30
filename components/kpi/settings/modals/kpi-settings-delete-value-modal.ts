import { Locator, Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiTestIds } from '@locators/kpi';
import { composeTestId, requireTestId } from '../../../../utils/test-id';

export class KpiSettingsDeleteValueModal extends UiObject {
  readonly baseTestId: string;

  readonly modal: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly loader: Locator;

  constructor(page: Page, tableName: string, actionType: string, value: string) {
    super(page);
    this.baseTestId = requireTestId(
      composeTestId([tableName, actionType, value]),
      'KpiSettingsDeleteValueModal',
    );

    this.modal = this.locate.testId(`${this.baseTestId}__delete-modal`);
    this.confirmButton = this.locate.testId(kpiTestIds.settings.deleteConfirm);
    this.cancelButton = this.locate.testId(kpiTestIds.settings.deleteCancel);
    this.loader = this.locate.testId('delete-item__loader');
  }
}
