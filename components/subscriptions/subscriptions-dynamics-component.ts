import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { subscriptionsTestIds } from '@locators/subscriptions';

export class SubscriptionsDynamicsComponent extends UiObject {
  readonly tab: Locator;
  readonly content: Locator;
  readonly cardsList: Locator;
  readonly cardsViewport: Locator;
  readonly cards: Locator;
  readonly chart: Locator;
  readonly filtersButton: Locator;
  readonly dates: Locator;
  readonly calendarButton: Locator;

  constructor(page: Page, root: Locator) {
    super(page);
    const section = this.locate.within(root);
    this.tab = section.testId(subscriptionsTestIds.dynamics.tab);
    this.content = section.testId(subscriptionsTestIds.dynamics.content);
    this.cardsList = section.testId(subscriptionsTestIds.dynamics.cardsList);
    this.cardsViewport = section.testId(subscriptionsTestIds.dynamics.cardsViewport);
    this.cards = section.testId(subscriptionsTestIds.dynamics.cards);
    this.chart = section.testId(subscriptionsTestIds.dynamics.chart);
    this.filtersButton = section.testId(subscriptionsTestIds.dynamics.filtersButton);
    this.dates = section.testId(subscriptionsTestIds.dynamics.dates.root);
    this.calendarButton = this.locate
      .within(this.dates)
      .css(subscriptionsTestIds.dynamics.dates.calendarButton);
  }

  async expectMetrics(values: readonly string[]): Promise<void> {
    await this.expectations.count('Subscriptions Dynamics: metric card count', this.cards, 7);
    await this.expectations.visible('Subscriptions Dynamics: chart', this.chart);
    for (const value of values) {
      await this.expectations.containsText(`Subscriptions Dynamics: ${value}`, this.content, value);
    }
    for (const legend of [
      'Total revenue',
      'Total subscriptions',
      'Total trials',
      'Total trials converted',
      'Total one-time purchases',
      'Total intros',
      'Total intros converted',
    ]) {
      await this.expectations.containsText(`Subscriptions Dynamics: legend ${legend}`, this.chart, legend);
    }
    await this.expectNoTechnicalValues();
  }

  async expectNoTechnicalValues(): Promise<void> {
    await this.expectations.notContainsText(
      'Subscriptions Dynamics: no technical values',
      this.content,
      /NaN|undefined|null|\[object Object\]/i,
    );
  }

  async selectPeriod(period: 'week' | 'month' | 'threeMonths'): Promise<void> {
    await this.actions.click(
      `Subscriptions Dynamics: select ${period}`,
      this.locate.testId(subscriptionsTestIds.dynamics.dates[period]),
    );
  }

  expectPeriodInUrl(period: 'week' | 'month' | 'three_months'): Promise<void> {
    return this.expectations.url(
      `Subscriptions Dynamics: ${period} period in URL`,
      new RegExp(`[?&]period=${period}(?:&|$)`),
    );
  }

  async selectCustomRange(startDay: number, endDay: number): Promise<void> {
    await this.actions.click('Subscriptions Dynamics: open custom period', this.calendarButton);
    const dialog = this.locate.role('dialog');
    await this.expectations.visible('Subscriptions Dynamics: custom period calendar', dialog);
    for (const day of [startDay, endDay]) {
      await this.actions.click(
        `Subscriptions Dynamics: select custom day ${day}`,
        this.locate.within(dialog).role('option', { name: new RegExp(`^Choose .* ${day}(st|nd|rd|th),`) }),
      );
    }
    const apply = this.locate.testId(subscriptionsTestIds.dynamics.dates.applyButton);
    await this.expectations.enabled('Subscriptions Dynamics: custom period can be applied', apply);
    await this.actions.click('Subscriptions Dynamics: apply custom period', apply);
  }

  async selectOnlyIndicator(indicator: string, label: string): Promise<void> {
    await this.openFilters();
    await this.actions.click(
      'Subscriptions Dynamics: open Indicators',
      this.locate.testId(subscriptionsTestIds.dynamics.indicators.trigger),
    );
    await this.expectations.visible(
      'Subscriptions Dynamics: Indicators options',
      this.locate.testId(subscriptionsTestIds.dynamics.indicators.content),
    );
    await this.actions.click(
      'Subscriptions Dynamics: clear all Indicators',
      this.locate.testId(subscriptionsTestIds.dynamics.indicators.allOption),
    );
    await this.actions.click(
      `Subscriptions Dynamics: select ${indicator}`,
      this.locate.testId(subscriptionsTestIds.dynamics.indicators.option(indicator)),
    );
    await this.actions.click(
      'Subscriptions Dynamics: apply Indicators',
      this.locate.testId(subscriptionsTestIds.dynamics.indicators.applyButton),
    );
    await this.expectations.count('Subscriptions Dynamics: filtered metric card count', this.cards, 1);
    await this.expectations.containsText(
      'Subscriptions Dynamics: selected metric card',
      this.cardsList,
      label,
    );
    await this.expectations.notContainsText(
      'Subscriptions Dynamics: unselected chart legend is removed',
      this.chart,
      'Total subscriptions',
    );
  }

  async rejectEmptyIndicatorsAndRestoreAll(indicator: string): Promise<void> {
    const trigger = this.locate.testId(subscriptionsTestIds.dynamics.indicators.trigger);
    const apply = this.locate.testId(subscriptionsTestIds.dynamics.indicators.applyButton);
    await this.actions.click('Subscriptions Dynamics: reopen Indicators', trigger);
    await this.actions.click(
      `Subscriptions Dynamics: deselect ${indicator}`,
      this.locate.testId(subscriptionsTestIds.dynamics.indicators.option(indicator)),
    );
    await this.actions.click('Subscriptions Dynamics: try to apply empty Indicators', apply);
    await this.expectations.count(
      'Subscriptions Dynamics: empty Indicators selection is rejected',
      this.cards,
      1,
    );
    await this.expectations.containsText(
      'Subscriptions Dynamics: previous Indicator remains active',
      this.cardsList,
      'Total revenue',
    );
    await this.actions.click('Subscriptions Dynamics: reopen rejected Indicators', trigger);
    await this.actions.click(
      'Subscriptions Dynamics: restore all Indicators',
      this.locate.testId(subscriptionsTestIds.dynamics.indicators.allOption),
    );
    await this.expectations.enabled('Subscriptions Dynamics: restored Indicators can be applied', apply);
    await this.actions.click('Subscriptions Dynamics: apply restored Indicators', apply);
    await this.expectations.count('Subscriptions Dynamics: all metric cards restored', this.cards, 7);
  }

  async selectApp(appId: string, label: string): Promise<void> {
    await this.openFilters();
    await this.actions.click(
      'Subscriptions Dynamics: open Add Filter',
      this.locate.testId(subscriptionsTestIds.dynamics.addFilter.trigger),
    );
    await this.expectations.visible(
      'Subscriptions Dynamics: Add Filter options',
      this.locate.testId(subscriptionsTestIds.dynamics.addFilter.content),
    );
    await this.actions.click(
      'Subscriptions Dynamics: add App filter',
      this.locate.testId(subscriptionsTestIds.dynamics.addFilter.appOption),
    );
    await this.actions.click(
      'Subscriptions Dynamics: apply App filter kind',
      this.locate.testId(subscriptionsTestIds.dynamics.addFilter.applyButton),
    );
    await this.actions.click(
      `Subscriptions Dynamics: select ${label}`,
      this.locate.testId(subscriptionsTestIds.dynamics.app.option(appId)),
    );
    await this.actions.click(
      'Subscriptions Dynamics: apply App selection',
      this.locate.testId(subscriptionsTestIds.dynamics.app.applyButton),
    );
    await this.expectations.visible(
      `Subscriptions Dynamics: active App filter for ${label}`,
      this.locate.testId(subscriptionsTestIds.dynamics.app.activeFilter),
    );
  }

  async resetAppFilter(): Promise<void> {
    const activeFilter = this.locate.testId(subscriptionsTestIds.dynamics.app.activeFilter);
    await this.actions.click(
      'Subscriptions Dynamics: reset App filter',
      this.locate.testId(subscriptionsTestIds.dynamics.app.resetButton),
    );
    await this.expectations.hidden('Subscriptions Dynamics: App filter removed', activeFilter);
    await this.expectations.url('Subscriptions Dynamics: App parameter removed', /^(?!.*[?&]App=).*$/);
  }

  async expectHorizontalCardOverflow(): Promise<void> {
    await this.expectations.pollNumberAtLeast(
      'Subscriptions Dynamics: horizontal cards overflow',
      this.cardsViewport,
      () => this.cardsViewport.evaluate((node) => node.scrollWidth - node.clientWidth),
      1,
    );
  }

  async expectError(): Promise<void> {
    await this.expectations.containsText(
      'Subscriptions Dynamics: request error',
      this.tab,
      /Something went wrong|Repeat the request/i,
    );
  }

  expectScreenshot(): Promise<void> {
    return this.expectations.screenshot(
      'Subscriptions Dynamics: visual layout',
      this.chart,
      'subscriptions-dynamics.png',
    );
  }

  private async openFilters(): Promise<void> {
    const root = this.locate.testId(subscriptionsTestIds.dynamics.filtersRoot);
    if (!(await root.isVisible())) {
      await this.actions.click('Subscriptions Dynamics: show filters', this.filtersButton);
    }
    await this.expectations.visible('Subscriptions Dynamics: applied filters', root);
  }
}
