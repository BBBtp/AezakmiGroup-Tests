import { type Locator, type Page } from '@playwright/test';

import { nichesTestIds } from '@locators/master-sections';
import { BusinessSectionComponent } from '../common/business-section-component';

export class NichesOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly actionBar: Locator;
  readonly refreshNewButton: Locator;
  readonly refreshAllButton: Locator;
  readonly createAsoMobileAppButton: Locator;
  readonly createNicheButton: Locator;
  readonly tabs: Locator;
  readonly nicheListTab: Locator;
  readonly appListTab: Locator;
  readonly nicheList: Locator;
  readonly nicheListTable: Locator;
  readonly listTitle: Locator;
  readonly sortLabel: Locator;

  constructor(page: Page) {
    super(page, 'Niches');
    this.root = this.locate.testId(nichesTestIds.page);
    const section = this.locate.within(this.root);
    this.actionBar = section.testId(nichesTestIds.actions);
    this.refreshNewButton = section.testId(nichesTestIds.refreshNewButton);
    this.refreshAllButton = section.testId(nichesTestIds.refreshAllButton);
    this.createAsoMobileAppButton = section.testId(nichesTestIds.createAsoMobileAppButton);
    this.createNicheButton = section.testId(nichesTestIds.createNicheButton);
    this.tabs = section.testId(nichesTestIds.tabs);
    this.nicheListTab = section.testId(nichesTestIds.nicheListTab);
    this.appListTab = section.testId(nichesTestIds.appListTab);
    this.nicheList = section.testId(nichesTestIds.nicheList);
    this.nicheListTable = section.testId(nichesTestIds.nicheListTable);
    this.listTitle = section.testId(nichesTestIds.listTitle);
    this.sortLabel = section.testId(nichesTestIds.sortLabel);
  }

  async expectBusinessControls(): Promise<void> {
    await this.expectHealthy();
    await this.expectControls([
      ['action bar', this.actionBar],
      ['Refresh new action', this.refreshNewButton],
      ['Refresh all action', this.refreshAllButton],
      ['Create app in AsoMobile action', this.createAsoMobileAppButton],
      ['Create new niche action', this.createNicheButton],
      ['section tabs', this.tabs],
      ['Niche list tab', this.nicheListTab],
      ['App list tab', this.appListTab],
      ['niche list', this.nicheList],
      ['niche list table', this.nicheListTable],
      ['niche list title', this.listTitle],
      ['niche list sorting', this.sortLabel],
    ]);
  }
}
