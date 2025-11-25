"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiSettingsScoreComponent = void 0;
const test_1 = require("@playwright/test");
const kpi_settings_table_component_1 = require("./kpi-settings-table-component");
class KpiSettingsScoreComponent extends kpi_settings_table_component_1.KpiSettingsTableComponent {
    sufficientScoreBlock;
    sufficientScoreEditButton;
    sufficientScoreValue;
    minimalScoreBlock;
    minimalScoreEditButton;
    minimalScoreValue;
    constructor(page) {
        super(page, 'score', { hasValueColumn: false, hasFooterBar: false });
        this.sufficientScoreBlock = page.locator('[data-testid="score__Sufficient score"]');
        this.sufficientScoreEditButton = page.locator('[data-testid="score__Sufficient score__edit"]');
        this.sufficientScoreValue = page.locator('[data-testid="score__Sufficient score__min-score"]');
        this.minimalScoreBlock = page.locator('[data-testid="score__Minimal score"]');
        this.minimalScoreEditButton = page.locator('[data-testid="score__Minimal score__edit"]');
        this.minimalScoreValue = page.locator('[data-testid="score__Minimal score__min-score"]');
    }
    async expectCoreValuesVisible() {
        await (0, test_1.expect)(this.sufficientScoreBlock).toBeVisible();
        await (0, test_1.expect)(this.sufficientScoreEditButton).toBeVisible();
        await (0, test_1.expect)(this.sufficientScoreValue).toBeVisible();
        await (0, test_1.expect)(this.minimalScoreBlock).toBeVisible();
        await (0, test_1.expect)(this.minimalScoreEditButton).toBeVisible();
        await (0, test_1.expect)(this.minimalScoreValue).toBeVisible();
    }
}
exports.KpiSettingsScoreComponent = KpiSettingsScoreComponent;
