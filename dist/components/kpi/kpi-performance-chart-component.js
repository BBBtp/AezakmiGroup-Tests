"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiPerformanceChartComponent = void 0;
const test_1 = require("@playwright/test");
class KpiPerformanceChartComponent {
    root;
    title;
    tabs;
    scoreTab;
    mrrTab;
    constructor(page) {
        this.root = page.locator('[data-testid="performance-chart"]');
        this.title = this.root.locator('[data-testid="chart-title"]');
        this.tabs = this.root.locator('[data-testid="chart-tabs"]');
        this.scoreTab = this.root.locator('[data-testid="chart-tabs__Score"]');
        this.mrrTab = this.root.locator('[data-testid="chart-tabs__MRR"]');
    }
    async verifyVisible() {
        await (0, test_1.expect)(this.root).toBeVisible();
        await (0, test_1.expect)(this.scoreTab).toBeVisible();
        await (0, test_1.expect)(this.mrrTab).toBeVisible();
    }
}
exports.KpiPerformanceChartComponent = KpiPerformanceChartComponent;
