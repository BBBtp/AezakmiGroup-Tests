"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiPage = void 0;
const test_1 = require("@playwright/test");
const base_page_1 = require("../base-page");
// Common + KPI-specific components
const kpi_header_component_1 = require("../../components/kpi/kpi-header-component");
const kpi_card_group_component_1 = require("../../components/kpi/kpi-card-group-component");
const kpi_month_filters_component_1 = require("../../components/kpi/kpi-month-filters-component");
const kpi_performance_chart_component_1 = require("../../components/kpi/kpi-performance-chart-component");
const kpi_top_employees_component_1 = require("../../components/kpi/kpi-top-employees-component");
const kpi_employees_table_component_1 = require("../../components/kpi/kpi-employees-table-component");
const filter_form_component_1 = require("../../components/forms/filter-form-component");
class KpiPage extends base_page_1.BasePage {
    root;
    header;
    cards;
    filters;
    chart;
    topEmployees;
    employeesTable;
    filterForm;
    settingsButton;
    subtitle;
    errorContent;
    mainContent;
    monthEndWarning;
    constructor(page) {
        super(page);
        // Основной контейнер страницы KPI
        this.root = page.locator('[data-testid="kpi"]');
        // Подключаем компоненты
        this.header = new kpi_header_component_1.KpiHeaderComponent(page);
        this.cards = new kpi_card_group_component_1.KpiCardGroupComponent(page);
        this.filters = new kpi_month_filters_component_1.KpiMonthFiltersComponent(page);
        this.chart = new kpi_performance_chart_component_1.KpiPerformanceChartComponent(page);
        this.topEmployees = new kpi_top_employees_component_1.KpiTopEmployeesComponent(page);
        this.employeesTable = new kpi_employees_table_component_1.KpiEmployeesTableComponent(page);
        this.filterForm = new filter_form_component_1.FilterFormComponent(page, 'kpi-filter-form');
        // Общие элементы страницы
        this.settingsButton = page.locator('[data-testid="settings-button"]');
        this.subtitle = page.locator('[data-testid="subtitle"]');
        this.errorContent = page.locator('[data-testid="error-content"]');
        this.mainContent = page.locator('[data-testid="main-content"]');
        this.monthEndWarning = page.locator('[data-testid="month-end-warning"]');
    }
    async navigate() {
        await this.navigateTo('/kpi');
        await this.waitForPageLoad();
    }
    async waitForPageLoad() {
        await this.waitForLoad();
        await (0, test_1.expect)(this.mainContent).toBeVisible();
    }
}
exports.KpiPage = KpiPage;
