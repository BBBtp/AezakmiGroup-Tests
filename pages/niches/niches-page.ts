import { type Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { NichesOverviewComponent } from '../../components/niches/niches-overview-component';
import { BasePage } from '../base-page';

export class NichesPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly overview: NichesOverviewComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.overview = new NichesOverviewComponent(page);
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Niches', '/niches', 'Keywords');
    await this.overview.expectBusinessControls();
  }
}
