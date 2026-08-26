import { type Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import {
  StatisticsOverviewComponent,
  type StatisticsPeriod,
} from '../../components/statistics/statistics-overview-component';
import { BasePage } from '../base-page';
import { DateRangeCalendarComponent } from '../../components/common/date-range-calendar-component';

export class StatisticsPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly overview: StatisticsOverviewComponent;
  readonly calendar: DateRangeCalendarComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.overview = new StatisticsOverviewComponent(page);
    this.calendar = new DateRangeCalendarComponent(page);
  }

  async openRoute(): Promise<void> {
    await this.navigateTo('/success-rate');
    await this.overview.expectShellLoaded();
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Success rate', '/success-rate', 'Statistics');
    await this.overview.expectBusinessControls();
  }

  async expectFilterControls(): Promise<void> {
    await this.overview.expectFilterControls();
  }

  async expectPeriodActive(period: StatisticsPeriod): Promise<void> {
    await this.overview.expectPeriodActive(period);
  }

  chartSnapshot(): Promise<string> {
    return this.overview.chartSnapshot();
  }

  selectPeriodAndExpectUpdate(period: StatisticsPeriod, previousSnapshot?: string): Promise<string> {
    return this.overview.selectPeriodAndExpectUpdate(period, previousSnapshot);
  }

  selectPeriodAndExpectSnapshot(period: StatisticsPeriod, snapshot: string): Promise<void> {
    return this.overview.selectPeriodAndExpectSnapshot(period, snapshot);
  }

  async openCalendar(): Promise<void> {
    await this.actions.click('Statistics: open calendar', this.overview.calendarButton);
    await this.calendar.expectOpen();
  }
}
