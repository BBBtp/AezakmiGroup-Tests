import type { Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { ReviewsOverviewComponent } from '../../components/reviews/reviews-overview-component';
import { BasePage } from '../base-page';

export class ReviewsPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly overview: ReviewsOverviewComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.overview = new ReviewsOverviewComponent(page);
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Reviews and ratings', '/reviews');
    await this.overview.expectLoaded();
  }

  async openRouteFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Reviews and ratings', '/reviews');
  }

  async navigate(): Promise<void> {
    await this.navigateTo('/reviews');
    await this.expectations.url('Reviews URL', /\/reviews$/);
  }
}
