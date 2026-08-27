import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { subscriptionsTestIds } from '@locators/subscriptions';

export class SubscriptionsDailyComponent extends UiObject {
  readonly root: Locator;
  readonly content: Locator;
  readonly dates: Locator;
  readonly datePresets: Locator;
  readonly calendarButton: Locator;
  readonly cardsList: Locator;
  readonly cards: Locator;
  readonly cardsScrollCandidates: Locator;
  readonly table: Locator;
  readonly search: Locator;
  readonly perPage: Locator;
  readonly previousPage: Locator;
  readonly nextPage: Locator;
  readonly currentPage: Locator;
  readonly totalPages: Locator;

  constructor(page: Page, root: Locator) {
    super(page);
    this.root = root;
    const section = this.locate.within(root);
    this.content = section.testId(subscriptionsTestIds.dailyStatisticsContent);
    this.dates = section.testId(subscriptionsTestIds.dailyDates.root);
    const dates = this.locate.within(this.dates);
    this.datePresets = dates.testId(subscriptionsTestIds.dailyDates.presets);
    // The calendar icon has neither an accessible name nor a test id in the current frontend.
    this.calendarButton = dates.css(subscriptionsTestIds.dailyDates.calendarButton);
    this.cardsList = section.testId(subscriptionsTestIds.cardsList);
    this.cards = section.testId(subscriptionsTestIds.cards);
    this.cardsScrollCandidates = this.locate
      .within(this.cardsList)
      .css(subscriptionsTestIds.cardsScrollCandidates);
    this.table = section.testId(subscriptionsTestIds.table);
    const table = this.locate.within(this.table);
    this.search = table.testId(subscriptionsTestIds.tableControls.search);
    this.perPage = table.testId(subscriptionsTestIds.tableControls.perPage);
    this.previousPage = table.testId(subscriptionsTestIds.tableControls.previousPage);
    this.nextPage = table.testId(subscriptionsTestIds.tableControls.nextPage);
    this.currentPage = table.testId(subscriptionsTestIds.tableControls.currentPage);
    this.totalPages = table.testId(subscriptionsTestIds.tableControls.totalPages);
  }

  async selectPreset(position: number): Promise<string> {
    const ids = await this.datePresets.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-testid') ?? '').filter(Boolean),
    );
    const id = ids[position];
    if (!id) throw new Error(`Daily statistics preset #${position + 1} is unavailable`);
    await this.actions.click(`Subscriptions Daily: select preset ${id}`, this.locate.testId(id));
    return id.slice(-10);
  }

  async selectCalendarDay(day: number): Promise<void> {
    await this.actions.click('Subscriptions Daily: open calendar', this.calendarButton);
    const dialog = this.locate.role('dialog');
    await this.expectations.visible('Subscriptions Daily: calendar', dialog);
    await this.actions.click(
      `Subscriptions Daily: select calendar day ${day}`,
      this.locate.within(dialog).role('option', { name: new RegExp(`^Choose .* ${day}(st|nd|rd|th),`) }),
    );
    await this.actions.click(
      'Subscriptions Daily: apply calendar date',
      this.locate.testId(subscriptionsTestIds.dailyDates.applyButton),
    );
  }

  async expectTableStructure(appName: string, appleId: string, productId: string): Promise<void> {
    await this.expectations.visible('Subscriptions Daily: table', this.table);
    for (const heading of [
      'App',
      'GEO',
      'Revenue',
      'Subscriptions',
      'Trials',
      'Trials converted',
      'ID',
      'Number',
    ]) {
      await this.expectations.containsText(`Subscriptions Daily: ${heading} column`, this.table, heading);
    }
    for (const value of [appName, appleId, 'AppStore', productId]) {
      await this.expectations.containsText(`Subscriptions Daily: ${value}`, this.table, value);
    }
  }

  async expectAppStoreLink(appleId: string): Promise<void> {
    await this.expectations.attribute(
      'Subscriptions Daily: AppStore link contains Apple ID',
      this.locate
        .within(this.table)
        .role('link', { name: subscriptionsTestIds.tableControls.appStoreLinkName }),
      'href',
      new RegExp(appleId),
    );
  }

  async expandAllGeoAndExpect(...geos: string[]): Promise<void> {
    // The row expander currently has no accessible name/test id; it is scoped to the stable GEO cell.
    await this.actions.click(
      'Subscriptions Daily: expand All GEO',
      this.locate
        .within(this.locate.within(this.table).role('cell', { name: 'All', exact: true }))
        .role('button'),
    );
    for (const geo of geos) {
      await this.expectations.containsText(`Subscriptions Daily: expanded GEO ${geo}`, this.table, geo);
    }
  }

  async collapseAllGeoAndExpectHidden(...geos: string[]): Promise<void> {
    await this.actions.click(
      'Subscriptions Daily: collapse All GEO',
      this.locate.within(this.locate.within(this.table).role('cell', { name: /^All/ })).role('button'),
    );
    for (const geo of geos) {
      await this.expectations.hidden(
        `Subscriptions Daily: collapsed GEO ${geo}`,
        this.locate.within(this.table).role('cell', { name: geo, exact: true }),
      );
    }
  }

  async searchFor(value: string): Promise<void> {
    await this.actions.fill(`Subscriptions Daily: search ${value}`, this.search, value);
  }

  async expectSearchResult(appName: string, staleAppName: string): Promise<void> {
    await this.expectations.containsText('Subscriptions Daily: matching app remains', this.table, appName);
    await this.expectations.notContainsText(
      'Subscriptions Daily: non-matching app is removed',
      this.table,
      staleAppName,
    );
  }

  async clearSearchAndExpectApps(...appNames: string[]): Promise<void> {
    await this.actions.fill('Subscriptions Daily: clear search', this.search, '');
    await this.expectations.value('Subscriptions Daily: search is empty', this.search, '');
    for (const appName of appNames) {
      await this.expectations.containsText(
        `Subscriptions Daily: restored app ${appName}`,
        this.table,
        appName,
      );
    }
  }

  async sortBy(column: 'revenue' | 'subscriptions' | 'trials' | 'trials_converted'): Promise<void> {
    await this.actions.click(
      `Subscriptions Daily: sort by ${column}`,
      this.locate.within(this.table).testId(subscriptionsTestIds.tableControls.sortableColumn(column)),
    );
  }

  async goToNextPage(): Promise<void> {
    await this.actions.click('Subscriptions Daily: next page', this.nextPage);
    await this.expectations.text('Subscriptions Daily: current page', this.currentPage, '2');
  }

  async goToPreviousPage(): Promise<void> {
    await this.actions.click('Subscriptions Daily: previous page', this.previousPage);
    await this.expectations.text('Subscriptions Daily: current page', this.currentPage, '1');
  }

  async selectRowsPerPage(rows: 20 | 30 | 40 | 50): Promise<void> {
    await this.actions.click('Subscriptions Daily: open rows per page', this.perPage);
    await this.actions.click(
      `Subscriptions Daily: select ${rows} rows per page`,
      this.locate.testId(subscriptionsTestIds.tableControls.perPageOption(rows)),
    );
    await this.expectations.containsText(
      'Subscriptions Daily: rows per page applied',
      this.perPage,
      `${rows}`,
    );
  }

  async expectPagination(totalPages: number): Promise<void> {
    await this.expectations.containsText(
      'Subscriptions Daily: total pages',
      this.totalPages,
      new RegExp(`of\\s*${totalPages}`),
    );
  }

  async expectEmptySearch(): Promise<void> {
    await this.expectations.containsText(
      'Subscriptions Daily: empty search state',
      this.table,
      /No apps found|Try another search/i,
    );
  }

  async expectHorizontalOverflow(): Promise<void> {
    await this.expectations.pollNumberAtLeast(
      'Subscriptions Daily: horizontal table overflow',
      this.table,
      () =>
        this.locate
          .within(this.table)
          .css(subscriptionsTestIds.tableControls.descendants)
          .evaluateAll((nodes) => Math.max(0, ...nodes.map((node) => node.scrollWidth - node.clientWidth))),
      1,
    );
  }

  async expectNoData(): Promise<void> {
    await this.expectations.containsText(
      'Subscriptions Daily: empty API result',
      this.root,
      /No data|Statistics of the selected period does not exist/i,
    );
    await this.expectations.hidden('Subscriptions Daily: empty table is hidden', this.table);
    await this.expectations.notContainsText(
      'Subscriptions Daily: empty state has no technical values',
      this.root,
      /NaN|undefined|null|\[object Object\]/i,
    );
  }

  async expectPartialMetrics(values: readonly string[]): Promise<void> {
    await this.expectations.visible('Subscriptions Daily: карточки частичных данных', this.cardsList);
    await this.expectations.count('Subscriptions Daily: все карточки частичных данных', this.cards, 7);
    for (const value of values) {
      await this.expectations.containsText(
        `Subscriptions Daily: частичная метрика ${value}`,
        this.cardsList,
        value,
      );
    }
    await this.expectations.notContainsText(
      'Subscriptions Daily: частичные данные без технических значений',
      this.cardsList,
      /NaN|undefined|null|\[object Object\]/i,
    );
  }

  async expectCardsHorizontalScroll(): Promise<void> {
    await this.expectations.count('Subscriptions Daily: all metric cards', this.cards, 7);
    await this.expectations.pollNumberAtLeast(
      'Subscriptions Daily: metric cards horizontal overflow',
      this.cardsScrollCandidates,
      () =>
        this.cardsScrollCandidates.evaluateAll((nodes) =>
          Math.max(0, ...nodes.map((node) => node.scrollWidth - node.clientWidth)),
        ),
      1,
    );
    await this.actions.run('evaluate', 'Subscriptions Daily: scroll metric cards', this.cardsList, () =>
      this.cardsScrollCandidates.evaluateAll((nodes) => {
        const scrollable = nodes.reduce<HTMLElement | null>((largest, node) => {
          if (!(node instanceof HTMLElement) || node.scrollWidth <= node.clientWidth) return largest;
          if (!largest) return node;
          return node.scrollWidth - node.clientWidth > largest.scrollWidth - largest.clientWidth
            ? node
            : largest;
        }, null);
        if (!scrollable) throw new Error('Metric cards scroll container was not found');
        scrollable.scrollLeft = scrollable.scrollWidth;
        scrollable.dispatchEvent(new Event('scroll'));
      }),
    );
    await this.expectations.pollNumberAtLeast(
      'Subscriptions Daily: metric cards scrolled horizontally',
      this.cardsScrollCandidates,
      () =>
        this.cardsScrollCandidates.evaluateAll((nodes) =>
          Math.max(0, ...nodes.map((node) => (node instanceof HTMLElement ? node.scrollLeft : 0))),
        ),
      1,
    );
    await this.expectations.visible('Subscriptions Daily: last metric card is available', this.cards.last());
  }

  async expectVerticalScrollAndPagination(): Promise<void> {
    const body = this.locate.css(subscriptionsTestIds.pageBody);
    const scrollCandidates = this.locate.within(body).css(subscriptionsTestIds.pageScrollCandidates);
    await this.expectations.pollNumberAtLeast(
      'Subscriptions Daily: page vertical overflow',
      scrollCandidates,
      () =>
        scrollCandidates.evaluateAll((nodes) =>
          Math.max(0, ...nodes.map((node) => node.scrollHeight - node.clientHeight)),
        ),
      1,
    );
    await this.actions.run('evaluate', 'Subscriptions Daily: scroll page content', body, () =>
      scrollCandidates.evaluateAll((nodes) => {
        const scrollable = nodes.reduce<HTMLElement | null>((largest, node) => {
          if (!(node instanceof HTMLElement) || node.scrollHeight <= node.clientHeight) return largest;
          if (!largest) return node;
          return node.scrollHeight - node.clientHeight > largest.scrollHeight - largest.clientHeight
            ? node
            : largest;
        }, null);
        if (!scrollable) throw new Error('Daily page scroll container was not found');
        scrollable.scrollTop = scrollable.scrollHeight;
        scrollable.dispatchEvent(new Event('scroll'));
      }),
    );
    await this.expectations.pollNumberAtLeast(
      'Subscriptions Daily: vertical scroll position',
      scrollCandidates,
      () =>
        scrollCandidates.evaluateAll((nodes) =>
          Math.max(0, ...nodes.map((node) => (node instanceof HTMLElement ? node.scrollTop : 0))),
        ),
      1,
    );
    await this.expectations.visible('Subscriptions Daily: pagination after vertical scroll', this.totalPages);
  }

  async expectLoading(): Promise<void> {
    await this.expectations.visible(
      'Subscriptions Daily: loading shell',
      this.locate.css(subscriptionsTestIds.pageBody),
    );
    await this.expectations.hidden('Subscriptions Daily: content is pending', this.content);
  }

  async expectError(): Promise<void> {
    await this.expectations.containsText(
      'Subscriptions Daily: request error',
      this.locate.css(subscriptionsTestIds.pageBody),
      /Something went wrong|Repeat the request/i,
    );
  }

  async retryAfterError(): Promise<void> {
    await this.actions.click(
      'Subscriptions Daily: repeat failed request',
      this.locate.role('button', { name: subscriptionsTestIds.retryButtonName }),
    );
    await this.expectations.visible('Subscriptions Daily: content restored', this.content);
    await this.expectations.visible('Subscriptions Daily: table restored', this.table);
  }

  expectScreenshot(): Promise<void> {
    return this.expectations.screenshot(
      'Subscriptions Daily: visual layout',
      this.content,
      'subscriptions-daily.png',
    );
  }
}
