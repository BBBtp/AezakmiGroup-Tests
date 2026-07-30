import { type Locator, type Page } from '@playwright/test';

import { statisticsTestIds } from '@locators/master-sections';
import { BusinessSectionComponent } from '../common/business-section-component';

export class StatisticsOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly title: Locator;
  readonly chart: Locator;
  readonly weekTab: Locator;
  readonly monthTab: Locator;
  readonly threeMonthsTab: Locator;
  readonly calendarButton: Locator;
  readonly filtersButton: Locator;

  constructor(page: Page) {
    super(page, 'Statistics');
    this.root = this.locate.testId(statisticsTestIds.page);
    const section = this.locate.within(this.root);
    this.title = section.testId(statisticsTestIds.title);
    this.chart = section.testId(statisticsTestIds.chart);
    this.weekTab = section.testId(statisticsTestIds.periodTabs.week);
    this.monthTab = section.testId(statisticsTestIds.periodTabs.month);
    this.threeMonthsTab = section.testId(statisticsTestIds.periodTabs.threeMonths);
    this.calendarButton = section.testId(statisticsTestIds.calendarButton);
    this.filtersButton = section.testId(statisticsTestIds.filtersButton);
  }

  async expectBusinessControls(): Promise<void> {
    await this.expectHealthy();
    await this.expectControls([
      ['title', this.title],
      ['success-rate chart', this.chart],
      ['Week period', this.weekTab],
      ['Month period', this.monthTab],
      ['3 months period', this.threeMonthsTab],
      ['calendar', this.calendarButton],
      ['Filters action', this.filtersButton],
    ]);
  }
}
