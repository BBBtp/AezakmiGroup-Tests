import { type Page } from '@playwright/test';

import { PerformanceComponent } from '../../components/asa/performance-component';
import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { BasePage } from '../base-page';

export class PerformancePage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly content: PerformanceComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.content = new PerformanceComponent(page);
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Performance', '/performance', 'ASA');
    await this.content.expectLoaded();
  }

  async expectPeriodInUrl(from: string, to: string): Promise<void> {
    await this.expectations.url(
      'Performance: выбранный диапазон сохранён в URL',
      new RegExp(`/performance\\?from=${from}&to=${to}$`),
    );
  }
}
