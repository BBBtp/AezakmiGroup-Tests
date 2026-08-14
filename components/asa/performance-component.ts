import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { performanceLocators } from '@locators/master-sections';
import { DateRangeCalendarComponent } from '../common/date-range-calendar-component';

export class PerformanceComponent extends UiObject {
  readonly root: Locator;
  readonly title: Locator;
  readonly calendarButton: Locator;
  readonly cards: Locator[];
  readonly chartTitle: Locator;
  readonly tableTitle: Locator;
  readonly search: Locator;
  readonly calendar: DateRangeCalendarComponent;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
    this.title = this.locate.within(this.root).text(performanceLocators.title, { exact: true });
    // Frontend has no accessible name/test id for this icon. The SVG path uniquely identifies
    // the calendar button inside Performance; keep this documented fallback until UI adds a contract.
    this.calendarButton = this.locate.within(this.root).css(performanceLocators.calendarIconPath);
    this.cards = performanceLocators.cards.map((id) => this.locate.testId(id));
    this.chartTitle = this.locate.within(this.root).text(performanceLocators.chartTitle, { exact: true });
    this.tableTitle = this.locate.within(this.root).text(performanceLocators.tableTitle, { exact: true });
    this.search = this.locate.within(this.root).css(performanceLocators.search);
    this.calendar = new DateRangeCalendarComponent(page);
  }

  async expectLoaded(): Promise<void> {
    await this.expectations.visible('Performance: page', this.root);
    await this.expectations.visible('Performance: title', this.title);
    for (const period of performanceLocators.periodTabs) {
      await this.expectations.visible(
        `Performance: period ${period}`,
        this.locate.within(this.root).role('tab', { name: period, exact: true }),
      );
    }
    for (const card of this.cards) await this.expectations.visible('Performance: metric card', card);
    await this.expectations.visible('Performance: chart', this.chartTitle);
    await this.expectations.visible('Performance: table', this.tableTitle);
  }

  async openCalendar(): Promise<void> {
    await this.actions.click('Performance: open calendar', this.calendarButton);
    await this.calendar.expectOpen();
  }

  async selectPeriod(period: '1 month' | '3 months' | '6 months' | 'All time'): Promise<void> {
    const tab = this.locate.within(this.root).role('tab', { name: period, exact: true });
    await this.actions.click(`Performance: select ${period}`, tab);
    await this.expectations.attribute(`Performance: active ${period}`, tab, 'aria-selected', 'true');
  }

  async expectBusinessBlocks(): Promise<void> {
    for (const card of this.cards) {
      await this.expectations.notContainsText(
        'Performance: card without technical values',
        card,
        /NaN|undefined|null/i,
      );
    }
    await this.expectations.visible('Performance: Apps statistics search', this.search);
  }
}
