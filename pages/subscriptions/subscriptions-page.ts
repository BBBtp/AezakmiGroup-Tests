import { type Locator, type Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { SubscriptionsDailyComponent } from '../../components/subscriptions/subscriptions-daily-component';
import { SubscriptionsDynamicsComponent } from '../../components/subscriptions/subscriptions-dynamics-component';
import { SubscriptionsFiltersComponent } from '../../components/subscriptions/subscriptions-filters-component';
import { SubscriptionsMetricsComponent } from '../../components/subscriptions/subscriptions-metrics-component';
import { subscriptionsTestIds } from '../../locators/subscriptions';
import { BasePage } from '../base-page';
import { DateRangeCalendarComponent } from '../../components/common/date-range-calendar-component';

export class SubscriptionsPage extends BasePage {
  readonly root: Locator;
  readonly title: Locator;
  readonly dailyStatisticsTab: Locator;
  readonly dailyStatisticsContent: Locator;
  readonly shell: ApplicationShellComponent;
  readonly filters: SubscriptionsFiltersComponent;
  readonly metrics: SubscriptionsMetricsComponent;
  readonly daily: SubscriptionsDailyComponent;
  readonly dynamics: SubscriptionsDynamicsComponent;
  readonly dynamicsTabButton: Locator;
  readonly calendar: DateRangeCalendarComponent;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(subscriptionsTestIds.page);
    const section = this.locate.within(this.root);
    this.title = section.testId(subscriptionsTestIds.title);
    this.dailyStatisticsTab = section.testId(subscriptionsTestIds.dailyStatisticsTab);
    this.dailyStatisticsContent = section.testId(subscriptionsTestIds.dailyStatisticsContent);
    this.shell = new ApplicationShellComponent(page);
    this.filters = new SubscriptionsFiltersComponent(page, this.root);
    this.metrics = new SubscriptionsMetricsComponent(page, this.root);
    this.daily = new SubscriptionsDailyComponent(page, this.root);
    this.dynamics = new SubscriptionsDynamicsComponent(page, this.root);
    this.dynamicsTabButton = section.testId(subscriptionsTestIds.tabs.dynamics);
    this.calendar = new DateRangeCalendarComponent(page);
  }

  async openFromStatisticsGroup(): Promise<void> {
    await this.shell.openSidebarDestination('Subscriptions', '/subscriptions', 'Statistics');
    await this.expectations.visible('Subscriptions page', this.root);
    await this.expectations.visible('Subscriptions title', this.title);
    await this.expectations.visible('Subscriptions Daily statistics tab', this.dailyStatisticsTab);
    await this.expectations.visible('Subscriptions Daily statistics content', this.dailyStatisticsContent);
  }

  async openFromStatisticsGroupUntilLoading(): Promise<void> {
    await this.shell.openSidebarDestination('Subscriptions', '/subscriptions', 'Statistics');
    await this.expectations.url('Subscriptions: loading route', /\/subscriptions$/);
  }

  selectAllAppsAndExpectAllLabel(): Promise<void> {
    return this.filters.selectAllAppsAndExpectAllLabel();
  }

  selectAllThenDeselectOneAppAndExpectPartialLabel(): Promise<void> {
    return this.filters.selectAllThenDeselectOneAppAndExpectPartialLabel();
  }

  selectApp(label: string): Promise<void> {
    return this.filters.selectApp(label);
  }

  resetAppFilter(): Promise<void> {
    return this.filters.resetAppFilter();
  }

  expectMetrics(values: readonly string[], appName: string, productId: string): Promise<void> {
    return this.metrics.expectMetrics(values, appName, productId);
  }

  expectFilteredApp(appName: string, staleAppName: string): Promise<void> {
    return this.metrics.expectFilteredApp(appName, staleAppName);
  }

  async openDynamics(): Promise<void> {
    await this.actions.click('Subscriptions: open Dynamics of indicators', this.dynamicsTabButton);
    await this.expectations.visible('Subscriptions: Dynamics tab', this.dynamics.tab);
    await this.expectations.visible('Subscriptions: Dynamics content', this.dynamics.content);
  }

  async openDailyCalendar(): Promise<void> {
    await this.actions.click('Subscriptions Daily: open calendar', this.daily.calendarButton);
    await this.calendar.expectOpen();
  }

  async openDynamicsUntilSystemState(): Promise<void> {
    await this.actions.click('Subscriptions: open Dynamics system state', this.dynamicsTabButton);
    await this.expectations.visible('Subscriptions: Dynamics tab', this.dynamics.tab);
  }

  async setFixedTime(value: string): Promise<void> {
    await this.actions.run('evaluate', 'Subscriptions: fixed browser time', this.root, () =>
      this.page.clock.setFixedTime(new Date(value)),
    );
  }

  async setViewport(width: number, height: number): Promise<void> {
    await this.actions.run('evaluate', `Subscriptions: viewport ${width}x${height}`, this.root, () =>
      this.page.setViewportSize({ width, height }),
    );
  }

  async expandViewportAndExpectDailyContent(width: number, height: number): Promise<void> {
    const initialWidth = await this.daily.content.evaluate((node) => node.getBoundingClientRect().width);
    await this.setViewport(width, height);
    await this.expectations.pollNumberAtLeast(
      'Subscriptions Daily: content expands with available width',
      this.daily.content,
      () => this.daily.content.evaluate((node) => node.getBoundingClientRect().width),
      Math.floor(initialWidth) + 1,
    );
    await this.expectations.visible(
      'Subscriptions Daily: cards remain visible after resize',
      this.daily.cardsList,
    );
    await this.expectations.visible(
      'Subscriptions Daily: table remains visible after resize',
      this.daily.table,
    );
  }
}
