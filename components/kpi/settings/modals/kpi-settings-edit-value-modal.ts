import { Locator, Page } from '@playwright/test';
import { KpiSettingsEditValueForm } from '../forms/kpi-settings-edit-value-form';
import { composeTestId, requireTestId } from '../../../../utils/test-id';

export class KpiSettingsEditValueModal {
  readonly page: Page;
  readonly tableName: string;
  readonly actionType: string;
  readonly value: string;

  readonly trigger: Locator;
  readonly modal: Locator;
  readonly form: KpiSettingsEditValueForm;
  readonly deleteButton: Locator;

  constructor(page: Page, tableName: string, actionType: string, value: string) {
    this.page = page;
    this.tableName = tableName;
    this.actionType = actionType;
    this.value = value;

    const baseTestId = requireTestId(
      composeTestId([tableName, actionType, value]),
      'KpiSettingsEditValueModal',
    );
    this.trigger = page.locator(`[data-testid="${baseTestId}__edit"]`);
    this.modal = page.locator(`[data-testid="${baseTestId}__edit-modal"]`);
    this.deleteButton = page.locator(`[data-testid="${baseTestId}__delete"]`);
    this.form = new KpiSettingsEditValueForm(page, tableName, actionType, value);
  }
}
