import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { nicheResearchTestIds } from '@locators/niche-research';

export class NicheResearchDeleteComponent extends UiObject {
  readonly dialog: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = this.locate.role('dialog');
    this.confirmButton = this.locate.testId(nicheResearchTestIds.delete.confirm);
    this.cancelButton = this.locate.testId(nicheResearchTestIds.delete.cancel);
  }

  async expectOpen(): Promise<void> {
    await this.expectations.containsText(
      'Подтверждение удаления исследуемой ниши',
      this.dialog,
      'Deleting selected niche',
    );
  }

  async cancel(): Promise<void> {
    await this.actions.click('Отмена удаления исследуемой ниши', this.cancelButton);
    await this.expectClosed();
  }

  async confirm(): Promise<void> {
    await this.actions.click('Подтверждение удаления исследуемой ниши', this.confirmButton);
  }

  async expectClosed(): Promise<void> {
    await this.expectations.hidden('Подтверждение удаления исследуемой ниши', this.dialog);
  }

  async expectScreenshot(name: string): Promise<void> {
    await this.expectations.screenshot('Визуальное состояние удаления ниши', this.dialog, name);
  }
}
