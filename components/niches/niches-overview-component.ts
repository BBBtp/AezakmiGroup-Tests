import { type Locator, type Page } from '@playwright/test';

import { nichesTestIds } from '@locators/master-sections';
import { BusinessSectionComponent } from '../common/business-section-component';

export class NichesOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly actionBar: Locator;
  readonly archiveButton: Locator;
  readonly createNicheButton: Locator;
  readonly content: Locator;
  readonly nicheList: Locator;
  readonly nicheListTable: Locator;
  readonly listTitle: Locator;
  readonly sortLabel: Locator;
  readonly search: Locator;
  readonly tableBody: Locator;
  readonly pagination: Locator;
  readonly rowsTrigger: Locator;
  readonly currentPage: Locator;
  readonly totalPages: Locator;
  readonly previousPage: Locator;
  readonly nextPage: Locator;

  constructor(page: Page) {
    super(page, 'Niches');
    this.root = this.locate.testId(nichesTestIds.page);
    this.actionBar = this.locate.testId(nichesTestIds.actions);
    this.archiveButton = this.locate.testId(nichesTestIds.archiveButton);
    this.createNicheButton = this.locate.testId(nichesTestIds.createNicheButton);
    this.content = this.locate.testId(nichesTestIds.content);
    this.nicheList = this.locate.testId(nichesTestIds.nicheList);
    this.nicheListTable = this.locate.testId(nichesTestIds.nicheListTable);
    this.listTitle = this.locate.testId(nichesTestIds.listTitle);
    this.sortLabel = this.locate.testId(nichesTestIds.sortLabel);
    this.search = this.locate.testId(nichesTestIds.search);
    this.tableBody = this.locate.testId(nichesTestIds.tableBody);
    this.pagination = this.locate.testId(nichesTestIds.pagination.root);
    this.rowsTrigger = this.locate.testId(nichesTestIds.pagination.rowsTrigger);
    this.currentPage = this.locate.testId(nichesTestIds.pagination.current);
    this.totalPages = this.locate.testId(nichesTestIds.pagination.total);
    this.previousPage = this.locate.testId(nichesTestIds.pagination.previous);
    this.nextPage = this.locate.testId(nichesTestIds.pagination.next);
  }

  async expectListRows(minimum = 1): Promise<void> {
    await this.expectations.countAtLeast('Niche list: rows', this.locate.testId(/^niche-row-\d+$/), minimum);
  }

  async firstRowSnapshot(): Promise<{ name: string; module: string; updatedAt: string }> {
    const row = nichesTestIds.row(0);
    return {
      name: (await this.locate.testId(row.name).textContent())?.trim() ?? '',
      module: (await this.locate.testId(row.module).textContent())?.trim() ?? '',
      updatedAt: (await this.locate.testId(row.updatedAt).textContent())?.trim() ?? '',
    };
  }

  async openFirstRow(): Promise<{ name: string; module: string; updatedAt: string }> {
    const snapshot = await this.firstRowSnapshot();
    await this.actions.click('Niche list: open first row', this.locate.testId(nichesTestIds.row(0).more));
    return snapshot;
  }

  async searchFor(value: string): Promise<void> {
    await this.expectations.enabled('Niche list: search ready', this.search);
    await this.actions.fill(`Niche list: search ${value}`, this.search, value);
  }

  async expectRow(
    index: number,
    values: { name?: string; module?: string; updatedAt?: string },
  ): Promise<void> {
    const row = nichesTestIds.row(index);
    if (values.name)
      await this.expectations.text(`Niche row ${index}: name`, this.locate.testId(row.name), values.name);
    if (values.module)
      await this.expectations.text(
        `Niche row ${index}: module`,
        this.locate.testId(row.module),
        values.module,
      );
    if (values.updatedAt)
      await this.expectations.text(
        `Niche row ${index}: Last edited`,
        this.locate.testId(row.updatedAt),
        values.updatedAt,
      );
  }

  async expectEmpty(message: string | RegExp): Promise<void> {
    // The frontend mounts the empty-state panel outside the list page container.
    await this.expectations.visible('Niche list: empty state', this.locate.text(message));
    await this.expectations.notContainsText(
      'Niche list: no technical values',
      this.locate.role('main'),
      /NaN|undefined|null|\[object Object\]/i,
    );
  }

  async goNextAndBack(): Promise<void> {
    await this.actions.click('Niche list: next page', this.nextPage);
    await this.expectations.text('Niche list: page 2', this.currentPage, '2');
    await this.actions.click('Niche list: previous page', this.previousPage);
    await this.expectations.text('Niche list: page 1', this.currentPage, '1');
  }

  async expectSinglePage(rowCount: number): Promise<void> {
    await this.expectations.count(
      'Niche list: expected rows',
      this.locate.testId(/^niche-row-\d+$/),
      rowCount,
    );
    await this.expectations.hidden('Niche list: pagination hidden for one page', this.pagination);
  }

  async expectPagination(totalPages: number): Promise<void> {
    await this.expectations.visible('Niche list: pagination', this.pagination);
    await this.expectations.containsText('Niche list: total pages', this.totalPages, `${totalPages}`);
  }

  async expectOnlyMatchingRows(value: string): Promise<void> {
    await this.expectations.containsText('Niche list: matching row', this.tableBody, value);
    await this.expectations.notContainsText(
      'Niche list: nonmatching row hidden',
      this.tableBody,
      'Archived automation 2',
    );
  }

  async expectBusinessControls(): Promise<void> {
    await this.expectHealthy();
    await this.expectControls([
      ['action bar', this.actionBar],
      ['Archive action', this.archiveButton],
      ['Create new niche action', this.createNicheButton],
      ['content', this.content],
      ['niche list', this.nicheList],
      ['niche list table', this.nicheListTable],
      ['niche list title', this.listTitle],
      ['niche list sorting', this.sortLabel],
    ]);
  }

  async expectArchiveControls(): Promise<void> {
    await this.expectControls([
      ['niche list', this.nicheList],
      ['niche list table', this.nicheListTable],
      ['niche list title', this.listTitle],
      ['niche list sorting', this.sortLabel],
    ]);
  }
}
