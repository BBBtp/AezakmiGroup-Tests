import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { netProfitPredictLocators } from '@locators/net-profit-predict';

export class NetProfitPredictComponent extends UiObject {
  readonly root: Locator;
  readonly title: Locator;
  readonly chartTitle: Locator;
  readonly tableTitle: Locator;
  readonly chartAxisLabels: Locator;
  readonly chartBars: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
    const content = this.locate.within(this.root);
    this.title = content.text(netProfitPredictLocators.title, { exact: true });
    this.chartTitle = content.text(netProfitPredictLocators.chartTitle, { exact: true });
    this.tableTitle = content.text(netProfitPredictLocators.tableTitle, { exact: true });
    // Recharts renders X-axis labels inside SVG foreignObject elements without semantic IDs.
    this.chartAxisLabels = content.css(netProfitPredictLocators.chartAxisLabels);
    this.chartBars = content.css(netProfitPredictLocators.chartBars);
    this.rows = content.css(netProfitPredictLocators.tableRows);
  }

  async expectLoaded(currentYear: number): Promise<void> {
    await this.expectations.visible('Net profit predict: page', this.root);
    await this.expectations.visible('Net profit predict: title', this.title);
    await this.expectations.visible('Net profit predict: chart', this.chartTitle);
    await this.expectations.visible('Net profit predict: table', this.tableTitle);
    await this.expectations.visible(
      `Net profit predict: current year ${currentYear}`,
      this.periodTab(currentYear),
    );
  }

  async selectYear(year: number): Promise<void> {
    const tab = this.periodTab(year);
    await this.actions.click(`Net profit predict: select year ${year}`, tab);
    await this.expectations.attribute(
      `Net profit predict: selected year ${year}`,
      tab,
      'aria-selected',
      'true',
    );
  }

  async expectYearSelected(year: number): Promise<void> {
    await this.expectations.attribute(
      `Net profit predict: selected year ${year}`,
      this.periodTab(year),
      'aria-selected',
      'true',
    );
  }

  async expectDefaultExpandedAndPinnedApp(): Promise<void> {
    const appliedFilters = this.locate.testId(netProfitPredictLocators.appliedFilters);
    await this.expectations.visible('Net profit predict: filters expanded by default', appliedFilters);
    await this.expectations.visible('Net profit predict: chart remains visible', this.chartTitle);
    await this.expectations.visible('Net profit predict: table remains visible', this.tableTitle);

    const appFilter = this.filterTrigger('App');
    await this.expectations.containsText('Net profit predict: default App filter', appFilter, 'App: All');
    await this.expectations.hidden(
      'Net profit predict: pinned App filter has no remove action',
      this.locate.testId(netProfitPredictLocators.filterClose('App')),
    );
    await this.expectations.url(
      'Net profit predict: default App filter stored in searchParams',
      /[?&]App=all(?:&|$).*filters=App|[?&]filters=App(?:&|$).*App=all/,
    );
  }

  async expectFilterRowToggle(): Promise<void> {
    await this.expandFilters();
    await this.expectations.visible('Net profit predict: expanded App filter', this.filterTrigger('App'));
    await this.actions.click('Net profit predict: collapse filters', this.filtersButton());
    await this.expectations.hidden(
      'Net profit predict: collapsed filter row',
      this.locate.testId(netProfitPredictLocators.appliedFilters),
    );
    await this.expectations.visible('Net profit predict: chart after collapse', this.chartTitle);
    await this.actions.click('Net profit predict: expand filters again', this.filtersButton());
    await this.expectations.containsText(
      'Net profit predict: App selection preserved after expand',
      this.filterTrigger('App'),
      'App: All',
    );
  }

  async expectPeriodCalendar(previousYear: number, currentYear: number): Promise<void> {
    await this.selectYear(previousYear);
    await this.expectations.url(
      `Net profit predict: ${previousYear} period stored in searchParams`,
      new RegExp(`[?&]period=${previousYear}(?:&|$)`),
    );
    const calendarButton = this.locate.within(this.root).css(netProfitPredictLocators.calendarTrigger);
    await this.actions.click('Net profit predict: open custom period calendar', calendarButton);
    await this.expectations.visible(
      'Net profit predict: calendar header',
      this.locate.testId(netProfitPredictLocators.calendarHeader),
    );
    await this.expectations.visible(
      'Net profit predict: calendar start input',
      this.locate.testId(netProfitPredictLocators.calendarStart),
    );
    await this.expectations.visible(
      'Net profit predict: calendar end input',
      this.locate.testId(netProfitPredictLocators.calendarEnd),
    );
    await this.expectations.visible(
      'Net profit predict: calendar reset',
      this.locate.testId(netProfitPredictLocators.calendarReset),
    );
    await this.expectations.visible(
      'Net profit predict: calendar apply',
      this.locate.testId(netProfitPredictLocators.calendarApply),
    );

    const dialog = this.locate.role('dialog');
    for (const month of ['January', 'March'] as const) {
      await this.actions.click(
        `Net profit predict: select ${month} ${currentYear}`,
        this.locate.within(dialog).text(month, { exact: true }),
      );
    }
    await this.expectations.enabled(
      'Net profit predict: custom period can be applied',
      this.locate.testId(netProfitPredictLocators.calendarApply),
    );
    await this.actions.click(
      'Net profit predict: apply custom period',
      this.locate.testId(netProfitPredictLocators.calendarApply),
    );
    await this.expectations.url(
      'Net profit predict: custom period stored in searchParams',
      new RegExp(
        `[?&]fromDate=${currentYear}-01-01(?:&|$).*toDate=${currentYear}-03-01(?:&|$)|` +
          `[?&]toDate=${currentYear}-03-01(?:&|$).*fromDate=${currentYear}-01-01(?:&|$)`,
      ),
    );
  }

  async expectAppStatusFilter(): Promise<void> {
    await this.addFilter('App status');
    await this.openFilterIfClosed('App status');
    await this.expectations.visible(
      'Net profit predict: In progress status option',
      this.locate.text('In progress', { exact: true }),
    );
    await this.expectations.visible(
      'Net profit predict: Stopped status option',
      this.locate.text('Stopped', { exact: true }),
    );

    await this.selectAppStatus('In progress');
    await this.expectations.containsText(
      'Net profit predict: In progress status applied',
      this.filterTrigger('App status'),
      'In progress',
    );
    await this.expectations.url(
      'Net profit predict: App status stored in searchParams',
      /[?&]App(?:%20|\+)status=[^&]+/,
    );

    await this.openFilterIfClosed('App status');
    await this.actions.click(
      'Net profit predict: clear In progress status',
      this.locate
        .within(this.filterOptions('App status').filter({ hasText: 'In progress' }))
        .css(netProfitPredictLocators.filterOptionCheckbox),
    );
    await this.selectAppStatus('Stopped');
    await this.expectations.containsText(
      'Net profit predict: Stopped status applied',
      this.filterTrigger('App status'),
      'Stopped',
    );
  }

  async selectSingleApp(): Promise<string> {
    await this.expandFilters();
    await this.actions.click('Net profit predict: open App filter', this.filterTrigger('App'));
    const options = this.filterOptions('App');
    await this.expectations.nonEmpty('Net profit predict: App options', options);
    await this.expectations.visible(
      'Net profit predict: App search',
      this.locate.testId(netProfitPredictLocators.filterSearch('App')),
    );
    const selectAll = this.locate.testId(netProfitPredictLocators.filterSelectAll('App'));
    await this.expectations.attribute(
      'Net profit predict: Select all is selected',
      selectAll,
      'data-state',
      'checked',
    );
    await this.actions.click('Net profit predict: clear Select all', selectAll);

    const option = options.first();
    const title = (
      await this.actions.run('evaluate', 'Net profit predict: first App option title', option, () =>
        option.innerText(),
      )
    ).trim();
    const search = this.locate.testId(netProfitPredictLocators.filterSearch('App'));
    await this.actions.fill(
      'Net profit predict: search App',
      search,
      title.slice(0, Math.min(title.length, 8)),
    );
    await this.expectations.visible(`Net profit predict: searched App ${title}`, option);
    await this.actions.fill('Net profit predict: clear App search', search, '');
    await this.actions.check(
      `Net profit predict: select App ${title}`,
      this.locate.within(option).css(netProfitPredictLocators.filterOptionCheckbox),
    );
    await this.actions.click(
      'Net profit predict: apply single App',
      this.locate.testId(netProfitPredictLocators.filterApply('App')),
    );
    await this.expectations.notContainsText(
      'Net profit predict: concrete App shown in chip',
      this.filterTrigger('App'),
      'All',
    );
    return title;
  }

  async selectTeam(team: 'Aezakmi' | 'AppEmpire'): Promise<void> {
    await this.addFilter('Team');
    await this.openFilterIfClosed('Team');
    const optionLabel = this.locate.text(team, { exact: true });
    await this.expectations.visible(`Net profit predict: Team ${team} option`, optionLabel);
    const option = this.filterOptions('Team').filter({ hasText: team });
    await this.actions.check(
      `Net profit predict: select Team ${team}`,
      this.locate.within(option).css(netProfitPredictLocators.filterOptionCheckbox),
    );
    await this.actions.click(
      'Net profit predict: apply Team filter',
      this.locate.testId(netProfitPredictLocators.filterApply('Team')),
    );
    await this.expectations.url('Net profit predict: Team stored in searchParams', /[?&]Team=[^&]+/);
  }

  async expectNoResultsAndReset(): Promise<void> {
    await this.expectations.visible(
      'Net profit predict: no results title',
      this.locate.text(netProfitPredictLocators.emptyTitle, { exact: true }),
    );
    await this.expectations.visible(
      'Net profit predict: no results description',
      this.locate.text(netProfitPredictLocators.emptyDescription, { exact: true }),
    );
    await this.actions.click(
      'Net profit predict: reset filters from empty state',
      this.locate.testId(netProfitPredictLocators.resetAllFilters),
    );
    await this.expectations.visible('Net profit predict: chart after reset', this.chartTitle);
    await this.expandFilters();
    await this.expectations.containsText(
      'Net profit predict: App reset to All',
      this.filterTrigger('App'),
      'All',
    );
  }

  async changeAppFilterSelection(): Promise<string> {
    await this.expandFilters();
    await this.actions.click(
      'Net profit predict: open App filter',
      this.locate.testId(netProfitPredictLocators.appFilterTrigger),
    );
    // Any concrete application proves that a dynamic UUID, rather than the special All value,
    // survives navigation. The first visible business option is intentionally toggled because
    // the select-all model stores every remaining UUID when one application is excluded.
    const option = this.locate.css(netProfitPredictLocators.appFilterOptions).first();
    await this.expectations.visible('Net profit predict: first App option', option);
    const title = (
      await this.actions.run('evaluate', 'Net profit predict: selected App title', option, () =>
        option.innerText(),
      )
    ).trim();
    const testId = await option.getAttribute('data-testid');
    const id = testId?.split('__option-').at(-1);
    if (!id || id === 'all') throw new Error(`Unable to resolve App id for ${title}`);
    await this.actions.click(
      `Net profit predict: select App ${title}`,
      this.locate.within(option).css(netProfitPredictLocators.appFilterOptionCheckbox),
    );
    await this.actions.click(
      'Net profit predict: apply App filter',
      this.locate.testId(netProfitPredictLocators.appFilterApply),
    );
    await this.expectations.url(
      'Net profit predict: App stored in searchParams',
      /[?&]App=(?!all(?:&|$))[^&]+/,
    );
    const value = (await this.searchParams()).App;
    if (!value || value === 'all' || value.split(',').includes(id)) {
      throw new Error('Unable to resolve changed App filter value');
    }
    return value;
  }

  async searchParams(): Promise<Record<string, string>> {
    return this.actions.run('evaluate', 'Net profit predict: current searchParams', this.root, async () =>
      Object.fromEntries(new URL(this.page.url()).searchParams.entries()),
    );
  }

  async expectCurrentYearMonths(now: Date): Promise<void> {
    const year = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    await this.expectations.attribute(
      `Net profit predict: current year ${year} selected`,
      this.periodTab(year),
      'aria-selected',
      'true',
    );

    for (let month = 1; month <= 12; month += 1) {
      const label = netProfitPredictLocators.monthLabel(year, month);
      const monthLabel = this.chartMonth(label);
      if (month <= currentMonth) {
        await this.expectations.visible(`Net profit predict: chart month ${label}`, monthLabel);
      } else {
        await this.expectations.hidden(`Net profit predict: future chart month ${label}`, monthLabel);
      }
    }
  }

  async expectCompleteYear(year: number): Promise<void> {
    for (let month = 1; month <= 12; month += 1) {
      const label = netProfitPredictLocators.monthLabel(year, month);
      await this.expectations.visible(
        `Net profit predict: completed year chart month ${label}`,
        this.chartMonth(label),
      );
    }
  }

  private periodTab(year: number): Locator {
    return this.locate.within(this.root).role('tab', { name: String(year), exact: true });
  }

  private chartMonth(label: string): Locator {
    return this.locate.within(this.chartAxisLabels).text(label, { exact: true });
  }

  private filtersButton(): Locator {
    return this.locate.within(this.root).role('button', {
      name: netProfitPredictLocators.filtersButton,
    });
  }

  private filterTrigger(name: string): Locator {
    return this.locate.testId(netProfitPredictLocators.filterTrigger(name));
  }

  private filterOptions(name: string): Locator {
    return this.locate.css(netProfitPredictLocators.filterOptions(name));
  }

  private async expandFilters(): Promise<void> {
    const appliedFilters = this.locate.testId(netProfitPredictLocators.appliedFilters);
    const visible = await this.actions.run(
      'evaluate',
      'Net profit predict: inspect filter row state',
      appliedFilters,
      () => appliedFilters.isVisible(),
    );
    if (!visible) await this.actions.click('Net profit predict: expand filters', this.filtersButton());
    await this.expectations.visible('Net profit predict: expanded filter row', appliedFilters);
  }

  private async addFilter(name: 'App status' | 'Team'): Promise<void> {
    await this.expectations.nonEmpty(
      'Net profit predict: application data ready before filter configuration',
      this.rows,
    );
    await this.waitForChartStable();
    await this.expandFilters();
    const trigger = this.filterTrigger(name);
    const alreadyVisible = await this.actions.run(
      'evaluate',
      `Net profit predict: inspect ${name} filter`,
      trigger,
      () => trigger.isVisible(),
    );
    if (alreadyVisible) return;
    await this.actions.click(
      'Net profit predict: open add-filter popover',
      this.locate.testId(netProfitPredictLocators.addFilterTrigger),
    );
    const checkbox = this.locate.testId(netProfitPredictLocators.addFilterCheckbox(name));
    const checked = await this.actions.run(
      'evaluate',
      `Net profit predict: inspect ${name} selection`,
      checkbox,
      () => checkbox.getAttribute('aria-checked'),
    );
    if (checked !== 'true') {
      await this.actions.click(
        `Net profit predict: add ${name} filter`,
        this.locate.testId(netProfitPredictLocators.addFilterOption(name)),
      );
    }
    await this.expectations.attribute(
      `Net profit predict: ${name} selected in add-filter popover`,
      checkbox,
      'aria-checked',
      'true',
    );
    const apply = this.locate.testId(netProfitPredictLocators.addFilterApply);
    await this.expectations.enabled('Net profit predict: apply selected filters', apply);
    await this.actions.click('Net profit predict: apply filter list', apply);
    const encodedName = name === 'App status' ? 'App(?:%20|\\+)status' : name;
    await this.expectations.url(
      `Net profit predict: ${name} added to filter searchParams`,
      new RegExp(`[?&]filters=[^&]*${encodedName}`),
    );
    await this.expectations.visible(`Net profit predict: ${name} filter added`, trigger);
  }

  private async openFilterIfClosed(name: 'App status' | 'Team'): Promise<void> {
    const options = this.filterOptions(name);
    const open = await this.actions.run(
      'evaluate',
      `Net profit predict: inspect ${name} values popover`,
      options,
      () => options.first().isVisible(),
    );
    if (!open) {
      await this.actions.click(`Net profit predict: open ${name} filter`, this.filterTrigger(name));
    }
    await this.expectations.nonEmpty(`Net profit predict: ${name} values`, options);
  }

  private async selectAppStatus(status: 'In progress' | 'Stopped'): Promise<void> {
    const option = this.filterOptions('App status').filter({ hasText: status });
    await this.actions.check(
      `Net profit predict: select App status ${status}`,
      this.locate.within(option).css(netProfitPredictLocators.filterOptionCheckbox),
    );
    await this.actions.click(
      `Net profit predict: apply App status ${status}`,
      this.locate.testId(netProfitPredictLocators.filterApply('App status')),
    );
  }

  private async waitForChartStable(): Promise<void> {
    let previousSnapshot = '';
    let stableReads = 0;

    await this.expectations.pollNumberAtLeast(
      'Net profit predict: chart is stable before filter configuration',
      this.chartBars,
      async () => {
        const paths = await this.chartBars.evaluateAll((elements) =>
          elements.map((element) => element.getAttribute('d') ?? ''),
        );
        const snapshot = JSON.stringify(paths);
        stableReads = paths.length > 0 && snapshot === previousSnapshot ? stableReads + 1 : 0;
        previousSnapshot = snapshot;
        return stableReads;
      },
      5,
      {
        timeout: 15000,
        intervals: [200, 400],
      },
    );
  }
}
