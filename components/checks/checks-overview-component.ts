import { type Locator, type Page } from '@playwright/test';

import { checksTestIds } from '@locators/checks';
import { BusinessSectionComponent } from '../common/business-section-component';

export class ChecksOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly editKeywordsButton: Locator;
  readonly archiveButton: Locator;
  readonly tableList: Locator;
  readonly stateTabs: Locator[];
  readonly dateTabs: Locator[];
  readonly datePickerButton: Locator;

  constructor(page: Page) {
    super(page, 'Checks');
    this.root = this.locate.testId(checksTestIds.page);
    const section = this.locate.within(this.root);
    this.editKeywordsButton = section.testId(checksTestIds.editKeywordsButton);
    this.archiveButton = section.testId(checksTestIds.archiveButton);
    this.tableList = section.testId(checksTestIds.tableList);
    this.stateTabs = Object.values(checksTestIds.stateTabs).map((testId) => section.testId(testId));
    this.dateTabs = Object.values(checksTestIds.dateTabs).map((testId) => section.testId(testId));
    this.datePickerButton = section.testId(checksTestIds.datePickerButton);
  }

  async expectBusinessControls(): Promise<void> {
    await this.expectHealthy();
    await this.expectControls([
      ['Edit keywords action', this.editKeywordsButton],
      ['Archive link', this.archiveButton],
      ['checks table', this.tableList],
      ...this.stateTabs.map((tab, index) => [`state tab ${index + 1}`, tab] as const),
      ...this.dateTabs.map((tab, index) => [`date tab ${index + 1}`, tab] as const),
      ['date picker', this.datePickerButton],
    ]);
  }

  async openArchive(): Promise<void> {
    await this.actions.click('Checks: open Archive', this.archiveButton);
    await this.expectations.url('Checks Archive', /\/checks\/archive$/);
    await this.expectBusinessControls();
  }
}
