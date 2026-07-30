import { type Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { StatisticsOverviewComponent } from '../../components/statistics/statistics-overview-component';
import { BasePage } from '../base-page';

export class StatisticsPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly overview: StatisticsOverviewComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.overview = new StatisticsOverviewComponent(page);
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Statistics', '/statistics');
    await this.overview.expectBusinessControls();
  }
}
