import type { Page } from '@playwright/test';

import { AdministrationComponent } from '../../components/administration/administration-component';
import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { BasePage } from '../base-page';

export class AdministrationPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly content: AdministrationComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.content = new AdministrationComponent(page);
  }

  async openParameters(): Promise<void> {
    await this.navigateTo('/parameters');
    await this.content.expectParameters();
  }

  async openParametersFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Parameters', '/parameters', 'Settings');
    await this.content.expectParameters();
  }

  async openEmployees(): Promise<void> {
    await this.navigateTo('/employees');
    await this.content.expectEmployees();
  }
}
