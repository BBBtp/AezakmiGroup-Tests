import { type Locator, type Page } from '@playwright/test';

import { checksTestIds } from '@locators/checks';
import { BusinessSectionComponent } from '../common/business-section-component';

export class ChecksOverviewComponent extends BusinessSectionComponent {
  readonly root: Locator;
  readonly editKeywordsButton: Locator;
  readonly archiveButton: Locator;
  readonly tableList: Locator;
  readonly stateTabs: Locator[];
  readonly dateTabs: Locator[];
  readonly datePickerButton: Locator;
  readonly datePicker: Locator;
  readonly datePickerReset: Locator;
  readonly datePickerApply: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page, 'Checks');
    this.root = this.locate.testId(checksTestIds.page);
    const section = this.locate.within(this.root);
    this.editKeywordsButton = section.testId(checksTestIds.editKeywordsButton);
    this.archiveButton = section.testId(checksTestIds.archiveButton);
    this.tableList = section.testId(checksTestIds.tableList);
    this.stateTabs = Object.values(checksTestIds.stateTabs).map((testId) => section.testId(testId));
    this.dateTabs = Object.values(checksTestIds.dateTabs).map((testId) => section.testId(testId));
    this.datePickerButton = section.testId(checksTestIds.datePickerButton);
    this.datePicker = this.locate.testId(checksTestIds.datePicker);
    this.datePickerReset = this.locate.testId(checksTestIds.datePickerReset);
    this.datePickerApply = this.locate.testId(checksTestIds.datePickerApply);
    this.emptyState = section.testId(checksTestIds.emptyState);
  }

  async selectState(state: 'new' | 'returned' | 'all'): Promise<void> {
    await this.actions.click(`фильтр состояния ${state}`, this.locate.testId(checksTestIds.stateTabs[state]));
    await this.expectations.attribute(
      `активный фильтр состояния ${state}`,
      this.locate.testId(checksTestIds.stateTabs[state]),
      'data-state',
      'active',
    );
  }

  async selectDatePeriod(period: 'today' | 'yesterday'): Promise<void> {
    await this.actions.click(`фильтр периода ${period}`, this.locate.testId(checksTestIds.dateTabs[period]));
    await this.expectations.attribute(
      `активный фильтр периода ${period}`,
      this.locate.testId(checksTestIds.dateTabs[period]),
      'data-state',
      'active',
    );
  }

  async expectEmptyState(): Promise<void> {
    await this.expectations.visible('понятное пустое состояние Checks', this.emptyState);
    await this.expectations.containsText(
      'сообщение пустого состояния Checks',
      this.emptyState,
      'Nothing was found',
    );
    await this.expectations.notContainsText(
      'пустое состояние без технических значений',
      this.root,
      /\b(?:undefined|NaN|null)\b|\[object Object\]/i,
    );
  }

  async expectStableFallback(): Promise<void> {
    await this.expectations.visible('каркас страницы Checks', this.root);
    await this.expectations.hidden('частичная таблица Checks', this.tableList);
    await this.expectations.notContainsText(
      'fallback без технических значений',
      this.root,
      /\b(?:undefined|NaN|null)\b|\[object Object\]/i,
    );
  }

  async expectDatePickerBoundaryState(): Promise<void> {
    await this.selectDatePeriod('yesterday');
    await this.actions.click('открыть календарь Checks', this.datePickerButton);
    await this.expectations.visible('календарь Checks', this.datePicker);
    await this.expectations.visible('кнопка сброса календаря', this.datePickerReset);
    await this.expectations.visible('кнопка применения календаря', this.datePickerApply);
    await this.expectations.disabled('сброс календаря без пользовательского диапазона', this.datePickerReset);
  }

  async expectBusinessControls(): Promise<void> {
    await this.expectHealthy();
    await this.expectControls([
      ['Edit keywords action', this.editKeywordsButton],
      ['Archive link', this.archiveButton],
      ['checks table or empty state', this.tableList.or(this.emptyState)],
      ...this.stateTabs.map((tab, index) => [`state tab ${index + 1}`, tab] as const),
      ...this.dateTabs.map((tab, index) => [`date tab ${index + 1}`, tab] as const),
      ['date picker', this.datePickerButton],
    ]);
  }

  async openArchive(): Promise<void> {
    await this.actions.click('Checks: open Archive', this.archiveButton);
    await this.expectations.url('Checks Archive', /\/checks\/archive$/);
  }
}
