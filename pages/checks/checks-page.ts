import { type Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { ChecksOverviewComponent } from '../../components/checks/checks-overview-component';
import { EditKeywordsModalComponent } from '../../components/checks/edit-keywords-modal-component';
import { BasePage } from '../base-page';

export class ChecksPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly overview: ChecksOverviewComponent;
  readonly editKeywordsModal: EditKeywordsModalComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.overview = new ChecksOverviewComponent(page);
    this.editKeywordsModal = new EditKeywordsModalComponent(page);
  }

  async navigate(): Promise<void> {
    await this.navigateTo('/checks');
    await this.expectLoaded();
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Checks', '/checks', 'Keywords');
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.overview.expectHealthy();
    await this.expectations.visible('Checks: Edit keywords action', this.overview.editKeywordsButton);
  }

  async expectBusinessControls(): Promise<void> {
    await this.overview.expectBusinessControls();
  }

  async openEditKeywords(): Promise<EditKeywordsModalComponent> {
    await this.actions.click('Checks: edit keywords', this.overview.editKeywordsButton);
    await this.editKeywordsModal.expectListOpen();
    return this.editKeywordsModal;
  }

  async expectArchiveRoundTrip(): Promise<void> {
    await this.overview.openArchive();
    await this.shell.openSidebarDestination('Checks', '/checks', 'Keywords');
    await this.expectLoaded();
  }
}
