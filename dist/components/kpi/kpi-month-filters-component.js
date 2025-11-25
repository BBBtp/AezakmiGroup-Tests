"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiMonthFiltersComponent = void 0;
const test_1 = require("@playwright/test");
class KpiMonthFiltersComponent {
    root;
    tabs;
    activeTab;
    datePickerButton;
    constructor(page) {
        this.root = page.locator('[data-testid="month-filters"]');
        this.tabs = this.root.locator('[role="tab"]');
        this.activeTab = this.root.locator('[role="tab"][aria-selected="true"]');
        this.datePickerButton = this.root.locator('button._pickerButton_8b6qc_10');
    }
    /** Проверяет, что блок фильтров и табы отображаются */
    async verifyVisible() {
        await (0, test_1.expect)(this.root).toBeVisible();
        const tabCount = await this.tabs.count(); // await!
        (0, test_1.expect)(tabCount).toBeGreaterThan(0);
    }
    /** Проверяет, что активный таб виден и только один */
    async verifyActiveTab() {
        const activeCount = await this.root.locator('[role="tab"][aria-selected="true"]').count();
        (0, test_1.expect)(activeCount).toBe(1);
        await (0, test_1.expect)(this.activeTab).toBeVisible();
    }
    /** Переключает на вкладку по индексу */
    async selectTabByIndex(index) {
        const tab = this.tabs.nth(index);
        await tab.click();
        await (0, test_1.expect)(tab).toHaveAttribute('aria-selected', 'true');
    }
    async verifyMonthSwitchByIndex(index, mainContent) {
        const oldContent = await mainContent.textContent();
        await this.selectTabByIndex(index);
        await (0, test_1.expect)(async () => {
            const newContent = await mainContent.textContent();
            (0, test_1.expect)(newContent).not.toBe(oldContent);
        }).toPass();
    }
}
exports.KpiMonthFiltersComponent = KpiMonthFiltersComponent;
