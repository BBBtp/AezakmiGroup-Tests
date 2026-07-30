import { type Locator, type Page } from '@playwright/test';

import { suggestsTestIds } from '@locators/master-sections';
import { BusinessSectionComponent } from '../common/business-section-component';

export class SuggestsOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly title: Locator;
  readonly table: Locator;
  readonly dateTabs: Locator[];
  readonly datePickerButton: Locator;

  constructor(page: Page) {
    super(page, 'Suggests');
    this.root = this.locate.testId(suggestsTestIds.page);
    const section = this.locate.within(this.root);
    this.title = section.testId(suggestsTestIds.title);
    this.table = section.testId(suggestsTestIds.table);
    this.dateTabs = Object.values(suggestsTestIds.dateTabs).map((testId) => section.testId(testId));
    this.datePickerButton = section.testId(suggestsTestIds.datePickerButton);
  }

  async expectBusinessControls(): Promise<void> {
    await this.expectHealthy();
    await this.expectControls([
      ['title', this.title],
      ['suggests table', this.table],
      ...this.dateTabs.map((tab, index) => [`date tab ${index + 1}`, tab] as const),
      ['date picker', this.datePickerButton],
    ]);
  }
}
