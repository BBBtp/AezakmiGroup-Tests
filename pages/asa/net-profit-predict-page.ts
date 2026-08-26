import { type Page } from '@playwright/test';

import { NetProfitPredictComponent } from '../../components/asa/net-profit-predict-component';
import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { netProfitPredictLocators } from '@locators/net-profit-predict';
import { BasePage } from '../base-page';

export class NetProfitPredictPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly content: NetProfitPredictComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.content = new NetProfitPredictComponent(page);
  }

  async openFromSidebar(now: Date): Promise<void> {
    await this.shell.openSidebarDestination(
      netProfitPredictLocators.title,
      netProfitPredictLocators.route,
      netProfitPredictLocators.sidebarGroup,
    );
    await this.content.expectLoaded(now.getFullYear());
  }
}
