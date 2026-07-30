import { type Page, type Locator } from '@playwright/test';
import { kpiTestIds } from '@locators/kpi';
import { BasePage } from '../base-page';
import { KpiSettingsPage } from './kpi-settings-page';
import { KpiManagerPage } from './kpi-manager-page';

// Common + KPI-specific components
import { KpiHeaderComponent } from '../../components/kpi/kpi-header-component';
import { KpiCardGroupComponent } from '../../components/kpi/kpi-card-group-component';
import { KpiMonthFiltersComponent } from '../../components/kpi/kpi-month-filters-component';
import { KpiPerformanceChartComponent } from '../../components/kpi/kpi-performance-chart-component';
import { KpiTopEmployeesComponent } from '../../components/kpi/kpi-top-employees-component';
import { KpiEmployeesTableComponent } from '../../components/kpi/kpi-employees-table-component';

/**
 * Страница KPI
 */
export class KpiPage extends BasePage {
  /** Корневой контейнер страницы */
  readonly root: Locator;

  /** Заголовок KPI страницы */
  readonly header: KpiHeaderComponent;

  /** Группа карточек KPI */
  readonly cards: KpiCardGroupComponent;

  /** Фильтры по месяцам */
  readonly filters: KpiMonthFiltersComponent;

  /** Диаграмма производительности */
  readonly chart: KpiPerformanceChartComponent;

  /** Блок топ-сотрудников */
  readonly topEmployees: KpiTopEmployeesComponent;

  /** Таблица сотрудников KPI */
  readonly employeesTable: KpiEmployeesTableComponent;

  /** Кнопка настроек */
  readonly settingsButton: Locator;

  /** Подзаголовок страницы */
  readonly subtitle: Locator;

  /** Блок с ошибкой */
  readonly errorContent: Locator;

  /** Основной контент страницы */
  readonly mainContent: Locator;

  /** Предупреждение в конце месяца */
  readonly monthEndWarning: Locator;

  constructor(page: Page) {
    super(page);

    this.root = this.locate.testId(kpiTestIds.page);
    this.header = new KpiHeaderComponent(page);
    this.cards = new KpiCardGroupComponent(page);
    this.filters = new KpiMonthFiltersComponent(page, kpiTestIds.monthFilters.root);
    this.chart = new KpiPerformanceChartComponent(page);
    this.topEmployees = new KpiTopEmployeesComponent(page);
    this.employeesTable = new KpiEmployeesTableComponent(page);
    this.settingsButton = this.locate.testId(kpiTestIds.settingsButton);
    this.subtitle = this.locate
      .testId(kpiTestIds.pageSubtitle)
      .or(this.locate.testId(kpiTestIds.subtitle))
      .first();
    this.errorContent = this.locate.testId(kpiTestIds.errorContent);
    this.mainContent = this.locate.testId(kpiTestIds.mainContent);
    this.monthEndWarning = this.locate.testId(kpiTestIds.monthEndWarning);
  }

  /** Переход на страницу KPI */
  async navigate(): Promise<void> {
    await this.navigateTo('/kpi');
    await this.waitForPageLoad();
  }

  /** Открывает KPI Settings и возвращает готовую страницу */
  async openSettings(): Promise<KpiSettingsPage> {
    await Promise.all([
      this.page.waitForURL(/\/kpi\/settings/),
      this.actions.click('KPI: open settings', this.settingsButton),
    ]);

    const settingsPage = new KpiSettingsPage(this.page);
    await settingsPage.waitForPageLoad();
    return settingsPage;
  }

  manager(employeeId: string): KpiManagerPage {
    return new KpiManagerPage(this.page, employeeId);
  }

  async navigateSettings(): Promise<KpiSettingsPage> {
    const settingsPage = new KpiSettingsPage(this.page);
    await settingsPage.navigate();
    return settingsPage;
  }

  /** Ожидание полной загрузки KPI страницы */
  async waitForPageLoad(): Promise<void> {
    await this.waitForLoad();
    await this.expectations.visible('KPI main content', this.mainContent, { timeout: 30000 });
  }

  async expectSettingsActionVisible(): Promise<void> {
    await this.expectations.visible('KPI settings action', this.settingsButton);
  }

  async expectMainContentVisible(): Promise<void> {
    await this.expectations.visible('KPI main content', this.mainContent);
    await this.expectations.hidden('KPI error content', this.errorContent);
  }

  async expectErrorState(): Promise<void> {
    await this.expectations.visible('KPI error content', this.errorContent);
    await this.expectations.hidden('KPI main content', this.mainContent);
  }

  async expectSubtitle(value: string): Promise<void> {
    await this.expectations.visible('KPI subtitle', this.subtitle);
    await this.expectations.text('KPI subtitle', this.subtitle, value);
  }

  async expectEmployeeDetailsUrl(): Promise<void> {
    await this.expectations.url('KPI employee details URL', /\/kpi\/.+/);
  }
}
