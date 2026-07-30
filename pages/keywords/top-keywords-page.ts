import { type Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { TopKeywordsOverviewComponent } from '../../components/keywords/top-keywords-overview-component';
import { BasePage } from '../base-page';

export class TopKeywordsPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly overview: TopKeywordsOverviewComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.overview = new TopKeywordsOverviewComponent(page);
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Top-3000', '/keywords', 'Keywords');
    await this.overview.expectBusinessControls();
  }
}
