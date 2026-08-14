import { type Page } from '@playwright/test';

import { ReadOnlySectionComponent } from '../../components/common/read-only-section-component';
import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { readOnlySectionLocators, type ReadOnlySection } from '@locators/read-only-sections';
import { BasePage } from '../base-page';

export class ReadOnlySectionsPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly section: ReadOnlySectionComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.section = new ReadOnlySectionComponent(page);
  }

  async openFromSidebar(section: ReadOnlySection): Promise<void> {
    const contract = readOnlySectionLocators.sections[section];
    await this.shell.openSidebarDestination(
      contract.label,
      contract.href,
      'groupLabel' in contract ? contract.groupLabel : undefined,
    );
    await this.section.expectHealthy(section);
  }
}
