import { type Locator, type Page } from '@playwright/test';

import { suggestsTestIds } from '@locators/master-sections';
import { systemStateLocators } from '@locators/common';
import { BusinessSectionComponent } from '../common/business-section-component';

export class SuggestsOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly title: Locator;
  readonly table: Locator;
  readonly dateTabs: Locator[];
  readonly datePickerButton: Locator;
  readonly noData: Locator;

  constructor(page: Page) {
    super(page, 'Suggests');
    this.root = this.locate.testId(suggestsTestIds.page);
    const section = this.locate.within(this.root);
    this.title = section.testId(suggestsTestIds.title);
    this.table = section.testId(suggestsTestIds.table);
    this.dateTabs = Object.values(suggestsTestIds.dateTabs).map((testId) => section.testId(testId));
    this.datePickerButton = section.testId(suggestsTestIds.datePickerButton);
    this.noData = section.testId(suggestsTestIds.noData);
  }

  async expectShellLoaded(): Promise<void> {
    await this.expectations.visible('Suggests: root', this.root);
    await this.expectations.visible('Suggests: title', this.title);
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

  async expectError(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible(
      'Suggests: error title',
      within.text(systemStateLocators.errorTitle, { exact: true }),
    );
    await this.expectations.visible(
      'Suggests: error description',
      within.text(systemStateLocators.errorDescription, { exact: true }),
    );
    await this.expectations.visible(
      'Suggests: retry action',
      within.role('button', { name: systemStateLocators.retry, exact: true }),
    );
    await this.expectations.visible('Suggests: error table container', this.table);
  }

  async expectLoading(): Promise<void> {
    await this.expectations.visible(
      'Suggests: loading state',
      this.locate.within(this.root).css(systemStateLocators.loading).first(),
    );
  }

  async expectEmpty(): Promise<void> {
    await this.expectations.visible('Suggests: empty state', this.noData);
    await this.expectations.visible(
      'Suggests: empty title',
      this.locate.within(this.noData).text(suggestsTestIds.emptyTitle, { exact: true }),
    );
    await this.expectations.notContainsText(
      'Suggests empty: no technical values',
      this.root,
      systemStateLocators.technicalValue,
    );
  }
}
