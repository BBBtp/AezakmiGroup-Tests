import { expect, type Locator, type Page } from '@playwright/test';
import { dashboardSections, dashboardTestIds } from '@locators/navigation';
import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { BasePage } from '../base-page';

export class DashboardPage extends BasePage {
  readonly root: Locator;
  readonly title: Locator;
  readonly shell: ApplicationShellComponent;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(dashboardTestIds.page);
    this.title = this.locate.testId(dashboardTestIds.title);
    this.shell = new ApplicationShellComponent(page);
  }

  async navigate(): Promise<void> {
    await this.navigateTo('/dashboard');
    await this.expectLoaded();
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Dashboard', '/dashboard');
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.title).toBeVisible();
  }

  async expectBusinessControls(): Promise<void> {
    for (const label of dashboardSections) {
      await expect(this.locate.role('button', { name: new RegExp(`^${label}`) })).toBeVisible();
    }
    for (const testId of dashboardTestIds.controls) {
      await expect(this.locate.testId(testId)).toBeVisible();
    }
  }
}
