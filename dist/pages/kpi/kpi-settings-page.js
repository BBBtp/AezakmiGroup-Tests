"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiSettingsPage = void 0;
const test_1 = require("@playwright/test");
const base_page_1 = require("../base-page");
const kpi_settings_score_component_1 = require("../../components/kpi/settings/kpi-settings-score-component");
const kpi_settings_table_component_1 = require("../../components/kpi/settings/kpi-settings-table-component");
const kpi_settings_add_value_modal_1 = require("../../components/kpi/settings/modals/kpi-settings-add-value-modal");
const kpi_settings_delete_value_modal_1 = require("../../components/kpi/settings/modals/kpi-settings-delete-value-modal");
class KpiSettingsPage extends base_page_1.BasePage {
    root;
    loadingState;
    errorContent;
    breadcrumbs;
    scoreTable;
    abTestsTable;
    totalMrrTable;
    abTestsAddModal;
    totalMrrAddModal;
    constructor(page) {
        super(page);
        this.root = page.locator('[data-testid="kpi-settings"]');
        this.loadingState = page.locator('[data-testid="kpi-settings-loading"]');
        this.errorContent = page.locator('[data-testid="error-content"]');
        this.breadcrumbs = page.locator('[data-testid="bread-crumbs"]');
        this.scoreTable = new kpi_settings_score_component_1.KpiSettingsScoreComponent(page);
        this.abTestsTable = new kpi_settings_table_component_1.KpiSettingsTableComponent(page, 'ab-tests');
        this.totalMrrTable = new kpi_settings_table_component_1.KpiSettingsTableComponent(page, 'total-mrr');
        this.abTestsAddModal = new kpi_settings_add_value_modal_1.KpiSettingsAddValueModal(page, 'ab-tests');
        this.totalMrrAddModal = new kpi_settings_add_value_modal_1.KpiSettingsAddValueModal(page, 'total-mrr');
    }
    createAbTestRow(actionType, value) {
        return this.abTestsTable.createActionRow(actionType, value);
    }
    createTotalMrrRow(actionType, value) {
        return this.totalMrrTable.createActionRow(actionType, value);
    }
    createDeleteModal(tableName, actionType, value) {
        return new kpi_settings_delete_value_modal_1.KpiSettingsDeleteValueModal(this.page, tableName, actionType, value);
    }
    async navigate() {
        await this.navigateTo('/kpi/settings');
        await this.waitForPageLoad();
    }
    async waitForPageLoad() {
        await this.waitForLoad();
        await (0, test_1.expect)(this.root).toBeVisible();
        await (0, test_1.expect)(this.loadingState).toBeHidden({ timeout: 15000 });
    }
}
exports.KpiSettingsPage = KpiSettingsPage;
