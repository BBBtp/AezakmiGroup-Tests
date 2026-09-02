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

  async expectParametersAccessBlocked(): Promise<void> {
    await this.navigateTo('/parameters');
    await this.expectations.url('URL страницы входа после запрета доступа к Parameters', /\/login$/);
    await this.content.expectParametersUnavailable();
    await this.shell.expectDangerousActionsHidden();
  }

  async openEmployees(): Promise<void> {
    await this.navigateTo('/employees');
    await this.content.expectEmployees();
  }
}
