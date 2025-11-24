import { Page, Locator, expect } from '@playwright/test';

export class KpiPerformanceChartComponent {
    readonly root: Locator;
    readonly title: Locator;
    readonly tabs: Locator;
    readonly scoreTab: Locator;
    readonly mrrTab: Locator;

    constructor(page: Page) {
        this.root = page.locator('[data-testid="performance-chart"]');
        this.title = this.root.locator('[data-testid="chart-title"]');
        this.tabs = this.root.locator('[data-testid="chart-tabs"]');
        this.scoreTab = this.root.locator('[data-testid="chart-tabs__Score"]');
        this.mrrTab = this.root.locator('[data-testid="chart-tabs__MRR"]');
    }

    async verifyVisible() {
        await expect(this.root).toBeVisible();
        await expect(this.scoreTab).toBeVisible();
        await expect(this.mrrTab).toBeVisible();
    }

}
