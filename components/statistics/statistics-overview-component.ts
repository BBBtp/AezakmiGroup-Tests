import { type Locator, type Page } from '@playwright/test';

import { statisticsTestIds } from '@locators/master-sections';
import { systemStateLocators } from '@locators/common';
import { CardComponent } from '../common/card-component';
import { BusinessSectionComponent } from '../common/business-section-component';

export type StatisticsPeriod = 'week' | 'month' | 'threeMonths';

export class StatisticsOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly title: Locator;
  readonly chart: Locator;
  readonly weekTab: Locator;
  readonly monthTab: Locator;
  readonly threeMonthsTab: Locator;
  readonly calendarButton: Locator;
  readonly filtersButton: Locator;
  readonly totalSuccessRate: CardComponent;

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
    this.totalSuccessRate = new CardComponent(page, statisticsTestIds.totalCard);
  }

  async expectShellLoaded(): Promise<void> {
    await this.expectations.visible('Statistics: root', this.root);
    await this.expectations.visible('Statistics: title', this.title);
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

  async expectError(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible(
      'Statistics: error title',
      within.text(systemStateLocators.errorTitle, { exact: true }),
    );
    await this.expectations.visible(
      'Statistics: error description',
      within.text(systemStateLocators.errorDescription, { exact: true }),
    );
    await this.expectations.visible(
      'Statistics: retry action',
      within.role('button', { name: systemStateLocators.retry, exact: true }),
    );
    await this.expectations.hidden('Statistics: stale chart hidden', this.chart);
  }

  async expectLoading(): Promise<void> {
    await this.expectations.visible(
      'Statistics: loading state',
      this.locate.css(systemStateLocators.loading).first(),
    );
  }

  async expectEmpty(): Promise<void> {
    await this.totalSuccessRate.assertVisible('Total success rate');
    await this.expectations.text('Statistics: empty success rate', this.totalSuccessRate.mainValue, '0');
    await this.expectations.text('Statistics: empty absolute change', this.totalSuccessRate.absValue, '0');
    await this.expectations.containsText(
      'Statistics: empty period',
      this.totalSuccessRate.period,
      'last 0 days',
    );
    await this.expectations.notContainsText(
      'Statistics empty: no technical values',
      this.root,
      systemStateLocators.technicalValue,
    );
  }

  async expectFilterControls(): Promise<void> {
    await this.expectations.visible('Statistics: calendar filter', this.calendarButton);
    await this.expectations.enabled('Statistics: calendar filter', this.calendarButton);
    await this.expectations.visible('Statistics: Filters action', this.filtersButton);
    await this.expectations.enabled('Statistics: Filters action', this.filtersButton);
  }

  async expectPeriodActive(period: StatisticsPeriod): Promise<void> {
    const tab = this.periodTab(period);
    await this.expectations.attribute(`Statistics: active ${period} period`, tab, 'aria-selected', 'true');
  }

  async chartSnapshot(): Promise<string> {
    return (await this.chart.textContent()) ?? '';
  }

  async selectPeriodAndExpectUpdate(period: StatisticsPeriod, previousSnapshot?: string): Promise<string> {
    const previous = previousSnapshot ?? (await this.chartSnapshot());
    const tab = this.periodTab(period);
    await this.actions.click(`Statistics: select ${period} period`, tab);
    await this.expectPeriodActive(period);
    await this.expectations.textChanged(`Statistics chart after ${period} period`, this.chart, previous);
    return this.chartSnapshot();
  }

  async selectPeriodAndExpectSnapshot(period: StatisticsPeriod, snapshot: string): Promise<void> {
    const tab = this.periodTab(period);
    await this.actions.click(`Statistics: restore ${period} period`, tab);
    await this.expectPeriodActive(period);
    await this.expectations.text(`Statistics chart restored for ${period} period`, this.chart, snapshot);
  }

  private periodTab(period: StatisticsPeriod): Locator {
    return {
      week: this.weekTab,
      month: this.monthTab,
      threeMonths: this.threeMonthsTab,
    }[period];
  }
}
