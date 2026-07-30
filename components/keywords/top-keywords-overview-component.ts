import { type Locator, type Page } from '@playwright/test';

import { topKeywordsTestIds } from '@locators/master-sections';
import { BusinessSectionComponent } from '../common/business-section-component';

export class TopKeywordsOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly title: Locator;
  readonly table: Locator;
  readonly countryTabs: Locator[];
  readonly stateTabs: Locator[];
  readonly datePickerButton: Locator;

  constructor(page: Page) {
    super(page, 'Top-3000');
    this.root = this.locate.testId(topKeywordsTestIds.page);
    const section = this.locate.within(this.root);
    this.title = section.testId(topKeywordsTestIds.title);
    this.table = section.testId(topKeywordsTestIds.table);
    this.countryTabs = Object.values(topKeywordsTestIds.countryTabs).map((testId) => section.testId(testId));
    this.stateTabs = Object.values(topKeywordsTestIds.stateTabs).map((testId) => section.testId(testId));
    this.datePickerButton = section.testId(topKeywordsTestIds.datePickerButton);
  }

  async expectBusinessControls(): Promise<void> {
    await this.expectHealthy();
    await this.expectControls([
      ['title', this.title],
      ['keywords table', this.table],
      ...this.countryTabs.map((tab, index) => [`country tab ${index + 1}`, tab] as const),
      ...this.stateTabs.map((tab, index) => [`state tab ${index + 1}`, tab] as const),
      ['date picker', this.datePickerButton],
    ]);
  }
}
