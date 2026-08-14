import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { appListLocators } from '@locators/app-list';

export class AppListAddModalComponent extends UiObject {
  readonly root: Locator;
  readonly title: Locator;
  readonly teamLabel: Locator;
  readonly appLabel: Locator;
  readonly selects: Locator;
  readonly addAndStartButton: Locator;
  readonly addButton: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('dialog');
    const modal = this.locate.within(this.root);
    this.title = modal.text(appListLocators.addModal.title, { exact: true });
    this.teamLabel = modal.text(appListLocators.addModal.team, { exact: true });
    this.appLabel = modal.text(appListLocators.addModal.app, { exact: true });
    this.selects = modal.role('combobox');
    this.addAndStartButton = modal.role('button', {
      name: appListLocators.addModal.addAndStart,
      exact: true,
    });
    this.addButton = modal.role('button', { name: appListLocators.addModal.add, exact: true });
  }

  async expectOpen(): Promise<void> {
    await this.expectations.visible('App list add modal', this.root);
    await this.expectations.visible('App list add modal title', this.title);
  }

  async expectLoadingState(): Promise<void> {
    await this.expectations.disabled('App list: Add and start while loading', this.addAndStartButton);
    await this.expectations.disabled('App list: Add while loading', this.addButton);
  }

  async expectReadyForInput(): Promise<void> {
    await this.expectations.visible('App list add modal: Team', this.teamLabel);
    await this.expectations.visible('App list add modal: App', this.appLabel);
    await this.expectations.count('App list add modal selects', this.selects, 2);
    await this.expectations.disabled('App list: Add and start before selection', this.addAndStartButton);
    await this.expectations.disabled('App list: Add before selection', this.addButton);
  }

  async close(): Promise<void> {
    await this.actions.press('App list add modal: close', this.root, 'Escape');
    await this.expectations.hidden('App list add modal closed', this.root);
  }
}
