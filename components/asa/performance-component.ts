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
  readonly tableRows: Locator;
  readonly tableBody: Locator;
  readonly totalRow: Locator;
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
    this.tableRows = this.locate.within(this.root).css(performanceLocators.tableRows);
    this.tableBody = this.locate.within(this.root).css(performanceLocators.tableBody);
    this.totalRow = this.locate.within(this.root).css(performanceLocators.totalRow);
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

  async expectFilterInterface(): Promise<void> {
    await this.actions.click(
      'кнопка раскрытия фильтров Performance',
      this.locate.within(this.root).role('button', { name: performanceLocators.filtersButton, exact: true }),
    );
    await this.actions.click(
      'кнопка добавления фильтра',
      this.locate.testId(performanceLocators.filterTrigger).first(),
    );
    for (const name of performanceLocators.filterNames) {
      await this.expectations.visible(`фильтр ${name}`, this.locate.text(name, { exact: true }).last());
    }
    await this.expectations.visible(
      'кнопка применения фильтров',
      this.locate.role('button', { name: performanceLocators.applyFiltersButton, exact: true }).last(),
    );
  }

  async switchChartMetrics(): Promise<void> {
    for (const metric of performanceLocators.chartMetrics) {
      const button = this.locate.within(this.root).role('button', { name: metric, exact: true });
      await this.actions.click(`показатель графика ${metric}`, button);
      await this.expectations.visible(`выбранный показатель графика ${metric}`, button);
      await this.expectations.visible(
        'обновлённая область графика',
        this.locate.testId(performanceLocators.chartViewport),
      );
    }
  }

  async expectTableStructure(): Promise<void> {
    for (const header of performanceLocators.tableHeaders) {
      await this.expectations.visible(
        `колонка таблицы ${header}`,
        this.locate.within(this.root).text(header, { exact: true }).first(),
      );
    }
    await this.expectations.nonEmpty('строки приложений', this.tableRows);
    await this.expectations.visible('итоговая строка Total', this.totalRow);
    await this.expectations.notContainsText(
      'таблица без технических значений',
      this.tableBody,
      /\b(?:NaN|undefined|null)\b/i,
    );
  }

  async expandAndCollapseGeoRows(): Promise<void> {
    const applicationRow = this.tableRows
      .filter({ has: this.locate.css(performanceLocators.rowToggle) })
      .first();
    const applicationToggle = this.locate.within(applicationRow).css(performanceLocators.rowToggle).first();
    const collapsedText = await applicationRow.textContent();
    await this.actions.click('контрол раскрытия GEO у приложения', applicationToggle);
    await this.expectations.textChanged('детализация GEO приложения', applicationRow, collapsedText);
    await this.actions.click('контрол сворачивания GEO у приложения', applicationToggle);
    await this.expectations.text('исходная строка приложения', applicationRow, collapsedText ?? '');
  }

  async verifyApplicationSearch(): Promise<void> {
    const firstBusinessRow = this.tableRows.filter({ hasNotText: 'Total' }).first();
    const applicationName = (
      await this.locate.within(firstBusinessRow).css(performanceLocators.applicationLink).last().innerText()
    ).trim();
    const query = applicationName.slice(0, Math.min(5, applicationName.length));
    await this.actions.fill('поиск по части названия приложения', this.search, query);
    await this.expectations.url('поисковый запрос приложения отражён в URL', /[?&]search=.+/);
    await this.expectations.nonEmpty('результаты поиска приложения', this.tableRows);
    await this.actions.fill('поиск отсутствующего приложения', this.search, '__missing_application__');
    await this.expectations.pollNumber(
      'строки приложений для отсутствующего значения',
      this.tableRows,
      () => this.tableRows.count(),
      0,
    );
    await this.actions.fill('очищенное поле поиска приложения', this.search, '');
    await this.expectations.nonEmpty('восстановленный список приложений', this.tableRows);
  }

  async verifyPagination(): Promise<void> {
    await this.selectPeriod('All time');
    const rows = this.locate.testId(performanceLocators.pagination.rows);
    await this.expectations.visible('выбор количества строк', rows);
    const initialValue = await rows.textContent();
    await this.actions.click('список количества строк', rows);
    await this.actions.click(
      'вариант отображения 20 строк',
      this.locate.role('option', { name: performanceLocators.pagination.twentyRows, exact: true }),
    );
    await this.expectations.textChanged('выбранное количество строк', rows, initialValue);
    await this.expectations.nonEmpty('строки после изменения размера страницы', this.tableRows);
  }

  async verifyScrolling(): Promise<void> {
    await this.actions.run('evaluate', 'вертикальная прокрутка страницы до таблицы', this.tableTitle, () =>
      this.tableTitle.evaluate((element) => element.scrollIntoView({ block: 'start' })),
    );
    await this.expectations.visible('таблица после вертикальной прокрутки', this.tableTitle);
    for (const header of performanceLocators.tableHeaders) {
      await this.expectations.visible(
        `доступная после прокрутки колонка ${header}`,
        this.locate.within(this.root).text(header, { exact: true }).first(),
      );
    }
  }
}
