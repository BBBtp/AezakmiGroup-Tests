import { type Locator, type Page } from '@playwright/test';

import { checksTestIds } from '@locators/checks';
import { EditKeywordsModalComponent } from '../../components/checks/edit-keywords-modal-component';
import { BasePage } from '../base-page';

export class ChecksPage extends BasePage {
  readonly root: Locator;
  readonly editKeywordsButton: Locator;
  readonly editKeywordsModal: EditKeywordsModalComponent;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(checksTestIds.page);
    this.editKeywordsButton = this.locate.testId(checksTestIds.editKeywordsButton);
    this.editKeywordsModal = new EditKeywordsModalComponent(page);
  }

  async navigate(): Promise<void> {
    await this.navigateTo('/checks');
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.expectations.visible('Checks page', this.root);
    await this.expectations.visible('Edit keywords action', this.editKeywordsButton);
  }

  async openEditKeywords(): Promise<EditKeywordsModalComponent> {
    await this.actions.click('Checks: edit keywords', this.editKeywordsButton);
    await this.editKeywordsModal.expectListOpen();
    return this.editKeywordsModal;
  }
}
