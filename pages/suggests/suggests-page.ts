import { type Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { SuggestsOverviewComponent } from '../../components/suggests/suggests-overview-component';
import { BasePage } from '../base-page';

export class SuggestsPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly overview: SuggestsOverviewComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.overview = new SuggestsOverviewComponent(page);
  }

  async openRoute(): Promise<void> {
    await this.navigateTo('/suggests');
    await this.overview.expectShellLoaded();
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Suggests', '/suggests', 'Keywords');
    await this.overview.expectBusinessControls();
  }
}
