import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base-page';

// Common + KPI-specific components
import { KpiHeaderComponent } from '../../components/kpi/kpi-header-component';
import { KpiCardGroupComponent } from '../../components/kpi/kpi-card-group-component';
import { KpiMonthFiltersComponent } from '../../components/kpi/kpi-month-filters-component';
import { KpiPerformanceChartComponent } from '../../components/kpi/kpi-performance-chart-component';
import { KpiTopEmployeesComponent } from '../../components/kpi/kpi-top-employees-component';
import { KpiEmployeesTableComponent } from '../../components/kpi/kpi-employees-table-component';
import { FilterFormComponent } from '../../components/forms/filter-form-component';

export class KpiPage extends BasePage {
    readonly root: Locator;
    readonly header: KpiHeaderComponent;
    readonly cards: KpiCardGroupComponent;
    readonly filters: KpiMonthFiltersComponent;
    readonly chart: KpiPerformanceChartComponent;
    readonly topEmployees: KpiTopEmployeesComponent;
    readonly employeesTable: KpiEmployeesTableComponent;
    readonly filterForm: FilterFormComponent;

    readonly settingsButton: Locator;
    readonly subtitle: Locator;
    readonly errorContent: Locator;
    readonly mainContent: Locator;
    readonly monthEndWarning: Locator;

    constructor(page: Page) {
        super(page);

        // Основной контейнер страницы KPI
        this.root = page.locator('[data-testid="kpi"]');

        // Подключаем компоненты
        this.header = new KpiHeaderComponent(page);
        this.cards = new KpiCardGroupComponent(page);
        this.filters = new KpiMonthFiltersComponent(page);
        this.chart = new KpiPerformanceChartComponent(page);
        this.topEmployees = new KpiTopEmployeesComponent(page);
        this.employeesTable = new KpiEmployeesTableComponent(page);
        this.filterForm = new FilterFormComponent(page, 'kpi-filter-form');

        // Общие элементы страницы
        this.settingsButton = page.locator('[data-testid="settings-button"]');
        this.subtitle = page.locator('[data-testid="subtitle"]');
        this.errorContent = page.locator('[data-testid="error-content"]');
        this.mainContent = page.locator('[data-testid="main-content"]');
        this.monthEndWarning = page.locator('[data-testid="month-end-warning"]');
    }

    async navigate(): Promise<void> {
        await this.navigateTo('/kpi');
        await this.waitForPageLoad();
    }

    async waitForPageLoad(): Promise<void> {
        await this.waitForLoad();
        await expect(this.mainContent).toBeVisible();
    }
}
