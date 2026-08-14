import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import {
  appListLocators,
  type AppListCalendarMonth,
  type AppListPeriod,
  type AppListStatus,
  type AppListTeam,
} from '@locators/app-list';
import { DateRangeCalendarComponent } from '../common/date-range-calendar-component';
import { AppListAddModalComponent } from './app-list-add-modal-component';

export class AppListComponent extends UiObject {
  readonly root: Locator;
  readonly title: Locator;
  readonly addAppButton: Locator;
  readonly appsTitle: Locator;
  readonly search: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly rowHeadings: Locator;
  readonly rowsPerPage: Locator;
  readonly currentPage: Locator;
  readonly nextPage: Locator;
  readonly totalPages: Locator;
  readonly calendarButton: Locator;
  readonly calendar: DateRangeCalendarComponent;
  readonly addModal: AppListAddModalComponent;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
    const content = this.locate.within(this.root);
    this.title = content.role('heading', { name: appListLocators.title, exact: true });
    this.addAppButton = content.role('button', { name: appListLocators.addApp, exact: true });
    this.appsTitle = content.role('heading', { name: appListLocators.appsTitle, exact: true });
    this.search = content.role('searchbox', { name: appListLocators.search, exact: true });
    this.table = content.role('table');
    this.rows = this.locate.within(this.table).css(appListLocators.tableRows);
    this.rowHeadings = this.locate.within(this.table).role('heading', { level: 6 });
    this.rowsPerPage = content.role('combobox');
    this.currentPage = content.css(appListLocators.pagination.current);
    this.nextPage = content.css(appListLocators.pagination.next);
    this.totalPages = content.css(appListLocators.pagination.total);
    // The icon-only calendar control has no accessible name or test id in the current frontend.
    this.calendarButton = content.css(appListLocators.calendarIconPath);
    this.calendar = new DateRangeCalendarComponent(page);
    this.addModal = new AppListAddModalComponent(page);
  }

  private tab(name: AppListPeriod | AppListStatus | AppListTeam): Locator {
    return this.locate.within(this.root).role('tab', { name, exact: true });
  }

  async expectLoaded(): Promise<void> {
    await this.expectations.visible('App list root', this.root);
    await this.expectations.visible('App list title', this.title);
    await this.expectations.visible('App list Add app', this.addAppButton);
    await this.expectations.visible('App list search', this.search);
    await this.expectations.visible('App list Apps section', this.appsTitle);
    await this.expectations.visible('App list table', this.table);
    for (const period of appListLocators.periods) {
      await this.expectations.visible(`App list period ${period}`, this.tab(period));
    }
    // Both status and team groups contain an "All" tab, so assert the unique status tabs here.
    for (const status of appListLocators.statuses.slice(1)) {
      await this.expectations.visible(`App list status ${status}`, this.tab(status));
    }
    for (const team of appListLocators.teams.slice(1)) {
      await this.expectations.visible(`App list team ${team}`, this.tab(team));
    }
    for (const header of appListLocators.tableHeaders) {
      await this.expectations.visible(
        `App list table header ${header}`,
        this.locate.within(this.table).role('cell', { name: header, exact: true }),
      );
    }
    await this.expectations.notContainsText(
      'App list without technical values',
      this.root,
      /NaN|undefined|null/i,
    );
  }

  async expectEmptyState(): Promise<void> {
    await this.expectations.visible('App list empty title', this.title);
    await this.expectations.visible(
      'App list empty state title',
      this.locate.within(this.root).text(appListLocators.emptyTitle, { exact: true }),
    );
    await this.expectations.visible(
      'App list empty state description',
      this.locate.within(this.root).text(appListLocators.emptyDescription, { exact: true }),
    );
    await this.expectations.count(
      'App list empty state Add app actions',
      this.locate.within(this.root).role('button', { name: appListLocators.addApp, exact: true }),
      2,
    );
    await this.expectations.hidden('App list table hidden for empty state', this.table);
  }

  async selectStatus(status: Exclude<AppListStatus, 'All'>): Promise<void> {
    const tab = this.tab(status);
    await this.actions.click(`App list: status ${status}`, tab);
    await this.expectations.attribute(`App list: selected status ${status}`, tab, 'aria-selected', 'true');
  }

  async selectTeam(team: Exclude<AppListTeam, 'All'>): Promise<void> {
    const tab = this.tab(team);
    await this.actions.click(`App list: team ${team}`, tab);
    await this.expectations.attribute(`App list: selected team ${team}`, tab, 'aria-selected', 'true');
  }

  async selectPeriod(period: AppListPeriod): Promise<void> {
    const tab = this.tab(period);
    await this.actions.click(`App list: period ${period}`, tab);
    await this.expectations.attribute(`App list: selected period ${period}`, tab, 'aria-selected', 'true');
  }

  async expectVisibleRowsHaveStatus(status: string): Promise<void> {
    await this.expectations.nonEmpty('App list filtered rows', this.rows);
    await this.expectations.count(
      `App list rows with status ${status}`,
      this.rows.filter({ hasText: status }),
      await this.rows.count(),
    );
  }

  async searchFirstVisibleApp(): Promise<void> {
    await this.expectations.nonEmpty('App list rows before search', this.rowHeadings);
    const appName = await this.actions.run(
      'evaluate',
      'App list first app name',
      this.rowHeadings.first(),
      () => this.rowHeadings.first().innerText(),
    );
    await this.actions.fill('App list search', this.search, appName);
    await this.expectations.count('App list search result', this.rowHeadings, 1);
    await this.expectations.text('App list searched app', this.rowHeadings, appName);
    await this.actions.fill('App list clear search', this.search, '');
    await this.expectations.countAtLeast('App list rows after search reset', this.rowHeadings, 2);
  }

  async openCalendar(): Promise<void> {
    await this.actions.click('App list: open calendar', this.calendarButton);
    await this.calendar.expectOpen();
  }

  async selectCalendarMonthRange(start: AppListCalendarMonth, end: AppListCalendarMonth): Promise<void> {
    await this.actions.click(
      `App list calendar: start ${start}`,
      this.locate.role('button', { name: start, exact: true }),
    );
    await this.actions.click(
      `App list calendar: end ${end}`,
      this.locate.role('button', { name: end, exact: true }),
    );
    await this.calendar.apply();
  }

  async goToNextPage(): Promise<void> {
    await this.expectations.visible('App list rows per page', this.rowsPerPage);
    await this.expectations.containsText(
      'App list rows per page value',
      this.rowsPerPage,
      appListLocators.pagination.rows,
    );
    await this.expectations.enabled('App list next page enabled', this.nextPage);
    await this.actions.click('App list next page', this.nextPage);
    await this.expectations.text('App list current page', this.currentPage, '2');
    await this.expectations.visible('App list total pages', this.totalPages);
  }

  async expectHorizontalTableNavigation(): Promise<void> {
    await this.actions.run('evaluate', 'App list compact viewport', this.root, () =>
      this.page.setViewportSize({ width: 900, height: 900 }),
    );
    const overflow = () =>
      this.table.evaluate((table) => {
        let container = table.parentElement;
        while (container && container.scrollWidth <= container.clientWidth)
          container = container.parentElement;
        return container ? container.scrollWidth - container.clientWidth : 0;
      });
    await this.expectations.pollNumberAtLeast('App list horizontal overflow', this.table, overflow, 1);
    await this.actions.run('evaluate', 'App list table horizontally', this.table, () =>
      this.table.evaluate((table) => {
        let container = table.parentElement;
        while (container && container.scrollWidth <= container.clientWidth)
          container = container.parentElement;
        if (container) container.scrollLeft = container.scrollWidth;
      }),
    );
  }

  async openAddApp(): Promise<void> {
    await this.actions.click('App list: Add app', this.addAppButton);
    await this.addModal.expectOpen();
  }
}
