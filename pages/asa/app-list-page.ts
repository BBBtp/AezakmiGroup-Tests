import { type Page } from '@playwright/test';

import { AppListComponent } from '../../components/asa/app-list-component';
import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { BasePage } from '../base-page';

export class AppListPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly content: AppListComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.content = new AppListComponent(page);
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('App list', '/app-list', 'ASA');
    await this.content.expectLoaded();
  }
}
