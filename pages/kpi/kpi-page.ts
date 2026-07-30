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
import { FilterFormComponent } from '../../components/forms/filter-form-component';

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

  /** Форма фильтров KPI */
  readonly filterForm: FilterFormComponent;

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
    this.filters = new KpiMonthFiltersComponent(page, 'kpi-month-filters');
    this.chart = new KpiPerformanceChartComponent(page);
    this.topEmployees = new KpiTopEmployeesComponent(page);
    this.employeesTable = new KpiEmployeesTableComponent(page);
    this.filterForm = new FilterFormComponent(page, 'kpi-filter-form');
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
}
