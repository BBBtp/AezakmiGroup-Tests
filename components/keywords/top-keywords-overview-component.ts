import { type Locator, type Page } from '@playwright/test';

import { topKeywordsTestIds } from '@locators/master-sections';
import { BusinessSectionComponent } from '../common/business-section-component';

export type TopKeywordsCountry = keyof typeof topKeywordsTestIds.countryTabs;
export type TopKeywordsState = keyof typeof topKeywordsTestIds.stateTabs;

export class TopKeywordsOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly title: Locator;
  readonly table: Locator;
  readonly countryTabs: Locator[];
  readonly stateTabs: Locator[];
  readonly datePickerButton: Locator;
  readonly tableBody: Locator;
  readonly trafficHeader: Locator;
  readonly translateAllToggle: Locator;
  readonly currentPage: Locator;
  readonly totalPages: Locator;
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;
  readonly topAppsModal: Locator;
  readonly topAppsModalTitle: Locator;
  readonly topAppsModalCloseButton: Locator;

  constructor(page: Page) {
    super(page, 'Top-3000');
    this.root = this.locate.testId(topKeywordsTestIds.page);
    const section = this.locate.within(this.root);
    this.title = section.testId(topKeywordsTestIds.title);
    this.table = section.testId(topKeywordsTestIds.table);
    this.countryTabs = Object.values(topKeywordsTestIds.countryTabs).map((testId) => section.testId(testId));
    this.stateTabs = Object.values(topKeywordsTestIds.stateTabs).map((testId) => section.testId(testId));
    this.datePickerButton = section.testId(topKeywordsTestIds.datePickerButton);
    this.tableBody = section.testId(topKeywordsTestIds.tableBody);
    this.trafficHeader = section.testId(topKeywordsTestIds.tableHeaders.traffic);
    this.translateAllToggle = section.testId(topKeywordsTestIds.translateAllToggle);
    this.currentPage = section.testId(topKeywordsTestIds.pagination.currentPage);
    this.totalPages = section.testId(topKeywordsTestIds.pagination.totalPages);
    this.nextPageButton = section.testId(topKeywordsTestIds.pagination.nextButton);
    this.previousPageButton = section.testId(topKeywordsTestIds.pagination.previousButton);
    this.topAppsModal = this.locate.testId(topKeywordsTestIds.topAppsModal.root);
    const modal = this.locate.within(this.topAppsModal);
    this.topAppsModalTitle = modal.testId(topKeywordsTestIds.topAppsModal.title);
    this.topAppsModalCloseButton = modal.testId(topKeywordsTestIds.topAppsModal.closeButton);
  }

  async expectBusinessControls(): Promise<void> {
    await this.expectHealthy();
    await this.expectControls([
      ['title', this.title],
      ['keywords table', this.table],
      ...this.countryTabs.map((tab, index) => [`country tab ${index + 1}`, tab] as const),
      ...this.stateTabs.map((tab, index) => [`state tab ${index + 1}`, tab] as const),
      ['date picker', this.datePickerButton],
      ['translate all toggle', this.translateAllToggle],
    ]);
  }

  async expectFilterControls(): Promise<void> {
    await this.expectations.enabled('Top-3000: date picker', this.datePickerButton);
    for (const state of Object.keys(topKeywordsTestIds.stateTabs) as TopKeywordsState[]) {
      await this.expectations.enabled(`Top-3000: ${state} state`, this.stateTab(state));
    }
  }

  async tableSnapshot(): Promise<string> {
    return (await this.tableBody.textContent()) ?? '';
  }

  async selectStateAndExpectUpdate(state: TopKeywordsState, previous: string): Promise<string> {
    const tab = this.stateTab(state);
    await this.actions.click(`Top-3000: select ${state} state`, tab);
    await this.expectations.attribute(`Top-3000: active ${state} state`, tab, 'aria-selected', 'true');
    await this.expectations.textChanged(`Top-3000 table after ${state} state`, this.tableBody, previous);
    return this.tableSnapshot();
  }

  async selectStateAndExpectSnapshot(state: TopKeywordsState, snapshot: string): Promise<void> {
    const tab = this.stateTab(state);
    await this.actions.click(`Top-3000: restore ${state} state`, tab);
    await this.expectations.attribute(`Top-3000: active ${state} state`, tab, 'aria-selected', 'true');
    await this.expectations.text(`Top-3000 table restored for ${state} state`, this.tableBody, snapshot);
  }

  async expectRegionalTabsSwitchable(countries: readonly TopKeywordsCountry[]): Promise<void> {
    const initial = await this.tableSnapshot();
    for (const country of countries) {
      const tab = this.countryTab(country);
      await this.actions.click(`Top-3000: select ${country} region`, tab);
      await this.expectations.attribute(`Top-3000: active ${country} region`, tab, 'aria-selected', 'true');
      await this.expectations.visible(`Top-3000 table for ${country} region`, this.table);
    }
    const allTab = this.countryTab('all');
    await this.actions.click('Top-3000: restore all regions', allTab);
    await this.expectations.attribute('Top-3000: active all regions', allTab, 'aria-selected', 'true');
    await this.expectations.text('Top-3000 table restored for all regions', this.tableBody, initial);
  }

  async expectTableInteractions(): Promise<void> {
    await this.expectations.nonEmpty('Top-3000 keyword rows', this.keywordRows());
    await this.expectations.visible('Top-3000: Traffic header', this.trafficHeader);
    await this.expectations.nonEmptyText('Top-3000: current page', this.currentPage);
    await this.expectations.nonEmptyText('Top-3000: total pages', this.totalPages);

    const initialTable = await this.tableSnapshot();
    await this.actions.click('Top-3000: sort by Traffic descending', this.trafficHeader);
    await this.actions.click('Top-3000: sort by Traffic ascending', this.trafficHeader);
    await this.expectations.textChanged('Top-3000 table after Traffic sort', this.tableBody, initialTable);

    const initialPage = await this.currentPage.textContent();
    await this.expectations.enabled('Top-3000: next page', this.nextPageButton);
    await this.actions.click('Top-3000: open next page', this.nextPageButton);
    await this.expectations.textChanged('Top-3000: page number after next', this.currentPage, initialPage);
    await this.expectations.enabled('Top-3000: previous page', this.previousPageButton);
    await this.actions.click('Top-3000: return to previous page', this.previousPageButton);
    await this.expectations.text('Top-3000: restored page number', this.currentPage, initialPage ?? '');

    const firstRow = topKeywordsTestIds.row(0);
    await this.actions.click(
      'Top-3000: open Top Apps for first keyword',
      this.locate.within(this.root).testId(firstRow.openTopAppsButton),
    );
    await this.expectations.visible('Top-3000: Top Apps modal', this.topAppsModal);
    await this.expectations.nonEmptyText('Top-3000: Top Apps modal title', this.topAppsModalTitle);
    await this.actions.click('Top-3000: close Top Apps modal', this.topAppsModalCloseButton);
    await this.expectations.hidden('Top-3000: closed Top Apps modal', this.topAppsModal);
  }

  async expectTranslateAllRoundTrip(): Promise<void> {
    const initial = await this.tableSnapshot();
    await this.actions.click('Top-3000: enable Translate all', this.translateAllToggle);
    await this.expectations.attribute(
      'Top-3000: Translate all enabled',
      this.translateAllToggle,
      'aria-checked',
      'true',
    );
    await this.expectations.textChanged('Top-3000 translated keywords', this.tableBody, initial);
    await this.actions.click('Top-3000: disable Translate all', this.translateAllToggle);
    await this.expectations.attribute(
      'Top-3000: Translate all disabled',
      this.translateAllToggle,
      'aria-checked',
      'false',
    );
    await this.expectations.text('Top-3000 original keywords restored', this.tableBody, initial);
  }

  private countryTab(country: TopKeywordsCountry): Locator {
    return this.locate.within(this.root).testId(topKeywordsTestIds.countryTabs[country]);
  }

  private stateTab(state: TopKeywordsState): Locator {
    return this.locate.within(this.root).testId(topKeywordsTestIds.stateTabs[state]);
  }

  private keywordRows(): Locator {
    return this.locate.within(this.tableBody).testId(topKeywordsTestIds.keywordRows);
  }
}
