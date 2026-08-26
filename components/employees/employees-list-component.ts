import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { employeeListLocators } from '@locators/employees';

export class EmployeesListComponent extends UiObject {
  readonly root: Locator;
  readonly title: Locator;
  readonly rows: Locator;
  readonly employeeLinks: Locator;
  readonly searchInput: Locator;
  readonly timeZoneSort: Locator;
  readonly nextPage: Locator;
  readonly previousPage: Locator;
  readonly currentPage: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
    const within = this.locate.within(this.root);
    this.title = within.role('heading', { name: employeeListLocators.title, exact: true });
    this.rows = within.testId(employeeListLocators.rows);
    this.employeeLinks = within.testId(employeeListLocators.employeeLinks);
    this.searchInput = within.role('searchbox');
    this.timeZoneSort = within.role('button', {
      name: employeeListLocators.timeZone,
      exact: true,
    });
    this.nextPage = within.testId(employeeListLocators.nextPage);
    this.previousPage = within.testId(employeeListLocators.previousPage);
    this.currentPage = within.testId(employeeListLocators.currentPage);
  }

  async expectShellLoaded(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible('Employees: main', this.root);
    await this.expectations.visible('Employees: title', this.title);
    await this.expectations.visible(
      'Employees: description',
      within.text(employeeListLocators.description, { exact: true }),
    );
    for (const control of [
      employeeListLocators.archive,
      employeeListLocators.settings,
      employeeListLocators.create,
    ]) {
      await this.expectations.visible(
        `Employees: ${control}`,
        within.role('button', { name: control, exact: true }),
      );
    }
  }

  async expectLoaded(): Promise<void> {
    await this.expectShellLoaded();
    await this.expectations.visible(
      'Employees: Filters',
      this.locate.within(this.root).role('button', {
        name: employeeListLocators.filters,
        exact: true,
      }),
    );
    await this.expectations.visible('Employees: search', this.searchInput);
    await this.expectations.nonEmpty('Employees: rows', this.rows);
    await this.expectations.notContainsText(
      'Employees: no technical values',
      this.root,
      employeeListLocators.technicalValue,
    );
  }

  async sortByTimeZone(): Promise<void> {
    const firstRow = this.rows.first();
    const previous = await firstRow.textContent();
    await this.actions.click('Employees: sort by Time zone', this.timeZoneSort);
    await this.actions.click('Employees: reverse Time zone sort', this.timeZoneSort);
    await this.expectations.textChanged('Employees: sorted rows', firstRow, previous);
  }

  async openNextPageAndReturn(): Promise<void> {
    const firstRow = this.rows.first();
    const previous = await firstRow.textContent();
    await this.expectations.enabled('Employees: next page enabled', this.nextPage);
    await this.actions.click('Employees: open next page', this.nextPage);
    await this.expectations.text('Employees: second page', this.currentPage, '2');
    await this.expectations.textChanged('Employees: next page rows', firstRow, previous);
    await this.expectations.enabled('Employees: previous page enabled', this.previousPage);
    await this.actions.click('Employees: return to first page', this.previousPage);
    await this.expectations.text('Employees: first page restored', this.currentPage, '1');
  }

  async searchForMissingEmployee(value: string): Promise<void> {
    await this.actions.fill('Employees: search missing employee', this.searchInput, value);
    await this.expectations.count('Employees: no matching rows', this.rows, 0);
    await this.expectEmpty();
  }

  async resetSearch(): Promise<void> {
    const reset = this.locate
      .within(this.root)
      .role('button', { name: employeeListLocators.resetFilters, exact: true });
    await this.actions.click('Employees: reset search', reset);
    await this.expectations.value('Employees: search cleared', this.searchInput, '');
    await this.expectations.nonEmpty('Employees: rows restored', this.rows);
  }

  async expectEmpty(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible(
      'Employees: empty title',
      within.text(employeeListLocators.emptyTitle, { exact: true }),
    );
    await this.expectations.visible(
      'Employees: empty description',
      within.text(employeeListLocators.emptyDescription, { exact: true }),
    );
    await this.expectations.notContainsText(
      'Employees empty: no technical values',
      this.root,
      employeeListLocators.technicalValue,
    );
  }

  async expectError(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible(
      'Employees: error title',
      within.text(employeeListLocators.errorTitle, { exact: true }),
    );
    await this.expectations.visible(
      'Employees: error description',
      within.text(employeeListLocators.errorDescription, { exact: true }),
    );
    await this.expectations.visible(
      'Employees: retry action',
      within.role('button', { name: employeeListLocators.retry, exact: true }),
    );
    await this.expectations.count('Employees: stale rows hidden', this.rows, 0);
  }

  async expectLoading(): Promise<void> {
    await this.expectations.visible(
      'Employees: loading state',
      this.locate.within(this.root).css(employeeListLocators.loading).first(),
    );
  }
}
