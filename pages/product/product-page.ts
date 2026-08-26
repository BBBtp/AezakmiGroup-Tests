import type { Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { AbTestsComponent } from '../../components/product/ab-tests-component';
import { AbTestCreateComponent } from '../../components/product/ab-test-create-component';
import { AppsComponent } from '../../components/product/apps-component';
import { BasePage } from '../base-page';

export class ProductPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly apps: AppsComponent;
  readonly abTests: AbTestsComponent;
  readonly abTestCreate: AbTestCreateComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.apps = new AppsComponent(page);
    this.abTests = new AbTestsComponent(page);
    this.abTestCreate = new AbTestCreateComponent(page);
  }

  async openApps(): Promise<void> {
    await this.navigateTo('/apps');
    await this.apps.expectLoaded();
  }

  async openAppsFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Apps', '/apps', 'Product');
    await this.apps.expectLoaded();
  }

  async openAppsRoute(): Promise<void> {
    await this.navigateTo('/apps');
    await this.expectations.url('Apps: route URL', /\/apps$/);
  }

  async openAbTests(): Promise<void> {
    await this.navigateTo('/ab-tests');
    await this.abTests.expectLoaded();
  }

  async openAbTestsRoute(): Promise<void> {
    await this.navigateTo('/ab-tests');
    await this.expectations.url('A/B tests: route URL', /\/ab-tests$/);
  }

  async leaveAndReturnToAbTestsViaSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Dashboard', '/dashboard');
    await this.shell.openSidebarDestination('A/B tests', '/ab-tests', 'Product');
    await this.abTests.expectLoaded();
  }

  async backToApps(): Promise<void> {
    await this.actions.goBack('Apps: return to list');
    await this.expectations.url('Apps: list URL', /\/apps$/);
    await this.apps.expectLoaded();
  }

  async backToAbTests(): Promise<void> {
    await this.actions.goBack('A/B tests: return to list');
    await this.expectations.url('A/B tests: list URL', /\/ab-tests$/);
    await this.abTests.expectLoaded();
  }
}
