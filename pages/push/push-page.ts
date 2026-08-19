import type { Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { OutKeywordsComponent } from '../../components/push/out-keywords-component';
import { PushBotsComponent } from '../../components/push/push-bots-component';
import { BasePage } from '../base-page';

export class PushPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly bots: PushBotsComponent;
  readonly outKeywords: OutKeywordsComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.bots = new PushBotsComponent(page);
    this.outKeywords = new OutKeywordsComponent(page);
  }

  async openBotsFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Push bots', '/push-bots', 'Push');
    await this.bots.expectLoaded();
  }

  async openBotsRoute(): Promise<void> {
    await this.shell.openSidebarDestination('Push bots', '/push-bots', 'Push');
  }

  async openOutKeywordsFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Out keywords', '/out-keywords', 'Push');
    await this.outKeywords.expectLoaded();
  }

  async openOutKeywordsRoute(): Promise<void> {
    await this.shell.openSidebarDestination('Out keywords', '/out-keywords', 'Push');
  }

  async navigateToBots(): Promise<void> {
    await this.navigateTo('/push-bots');
    await this.expectations.url('Push bots URL', /\/push-bots$/);
  }

  async navigateToOutKeywords(): Promise<void> {
    await this.navigateTo('/out-keywords');
    await this.expectations.url('Out keywords URL', /\/out-keywords$/);
  }

  async goBackToBots(): Promise<void> {
    await this.actions.goBack('Push bots: return to list');
    await this.expectations.url('Push bots: list URL restored', /\/push-bots$/);
    await this.bots.expectLoaded();
  }

  async cancelCreate(): Promise<void> {
    await this.actions.goBack('Push bots create: cancel draft');
    await this.expectations.url('Push bots create: list URL restored', /\/push-bots$/);
    await this.bots.expectLoaded();
  }
}
