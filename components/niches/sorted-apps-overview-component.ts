import { type Locator, type Page } from '@playwright/test';

import { sortedAppsTestIds } from '@locators/master-sections';
import { BusinessSectionComponent } from '../common/business-section-component';
import { AsoMobileCreateComponent } from './aso-mobile-create-component';

export class SortedAppsOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly actionBar: Locator;
  readonly refreshNewButton: Locator;
  readonly refreshAllButton: Locator;
  readonly createAsoMobileAppButton: Locator;
  readonly content: Locator;
  readonly appList: Locator;
  readonly listTitle: Locator;
  readonly sortLabel: Locator;
  readonly refreshModal: Locator;
  readonly refreshTitle: Locator;
  readonly refreshClose: Locator;
  readonly refreshWarning: Locator;
  readonly refreshProcesses: Locator;
  readonly refreshSubmit: Locator;
  readonly asoMobileCreate: AsoMobileCreateComponent;

  constructor(page: Page) {
    super(page, 'Sorted by apps');
    this.root = this.locate.testId(sortedAppsTestIds.page);
    const section = this.locate.within(this.root);
    this.actionBar = section.testId(sortedAppsTestIds.actions);
    this.refreshNewButton = section.testId(sortedAppsTestIds.refreshNewButton);
    this.refreshAllButton = section.testId(sortedAppsTestIds.refreshAllButton);
    this.createAsoMobileAppButton = section.testId(sortedAppsTestIds.createAsoMobileAppButton);
    this.content = section.testId(sortedAppsTestIds.content);
    this.appList = section.testId(sortedAppsTestIds.appList);
    this.listTitle = section.testId(sortedAppsTestIds.listTitle);
    this.sortLabel = section.testId(sortedAppsTestIds.sortLabel);
    this.refreshModal = this.locate.testId(sortedAppsTestIds.refresh.modal);
    this.refreshTitle = this.locate.testId(sortedAppsTestIds.refresh.title);
    this.refreshClose = this.locate.testId(sortedAppsTestIds.refresh.close);
    this.refreshWarning = this.locate.testId(sortedAppsTestIds.refresh.warning);
    this.refreshProcesses = this.locate.testId(sortedAppsTestIds.refresh.processes);
    this.refreshSubmit = this.locate.testId(sortedAppsTestIds.refresh.submit);
    this.asoMobileCreate = new AsoMobileCreateComponent(page, this.root);
  }

  async expectBusinessControls(): Promise<void> {
    await this.expectHealthy();
    await this.expectControls([
      ['action bar', this.actionBar],
      ['Refresh new action', this.refreshNewButton],
      ['Refresh all action', this.refreshAllButton],
      ['Create app in AsoMobile action', this.createAsoMobileAppButton],
      ['content', this.content],
      ['app list', this.appList],
      ['app list title', this.listTitle],
      ['app list sorting', this.sortLabel],
    ]);
  }

  async openRefresh(mode: 'new' | 'all'): Promise<void> {
    await this.actions.click(
      `Sorted by apps: Refresh ${mode}`,
      mode === 'new' ? this.refreshNewButton : this.refreshAllButton,
    );
    await this.expectations.visible('Sorted by apps: refresh modal', this.refreshModal);
    await this.expectations.text(
      'Sorted by apps: refresh title',
      this.refreshTitle,
      mode === 'new' ? 'Refresh new data' : 'Refresh all data',
    );
    await this.expectations.visible('Sorted by apps: refresh warning', this.refreshWarning);
    await this.expectations.visible('Sorted by apps: refresh processes', this.refreshProcesses);
    await this.expectations.visible('Sorted by apps: start refresh', this.refreshSubmit);
  }

  async cancelRefresh(): Promise<void> {
    await this.actions.click('Sorted by apps: cancel refresh', this.refreshClose);
    await this.expectations.hidden('Sorted by apps: refresh modal closed', this.refreshModal);
  }

  async confirmRefresh(): Promise<void> {
    await this.actions.click('Sorted by apps: start refresh', this.refreshSubmit);
  }
}
