import { Page, Locator, expect } from '@playwright/test';

export class KpiMonthFiltersComponent {
    readonly root: Locator;
    readonly tabs: Locator;
    readonly activeTab: Locator;
    readonly datePickerButton: Locator;
    constructor(page: Page) {
        this.root = page.locator('[data-testid="month-filters"]');
        this.tabs = this.root.locator('[role="tab"]');
        this.activeTab = this.root.locator('[role="tab"][aria-selected="true"]');
        this.datePickerButton = this.root.locator('button._pickerButton_8b6qc_10');
    }
    async verifyVisible() {
        await expect(this.root).toBeVisible();
        const tabCount = await this.tabs.count();
        expect(tabCount).toBeGreaterThan(0);
    }
    async verifyActiveTab() {
        const activeCount = await this.root.locator('[role="tab"][aria-selected="true"]').count();
        expect(activeCount).toBe(1);
        await expect(this.activeTab).toBeVisible();
    }
    async selectTabByIndex(index: number) {
        const tab = this.tabs.nth(index);
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
    }
    async verifyMonthSwitchByIndex(index: number, mainContent: Locator) {
        const oldContent = await mainContent.textContent();
        await this.selectTabByIndex(index)
        await expect(async () => {
            const newContent = await mainContent.textContent();
            expect(newContent).not.toBe(oldContent);
        }).toPass();
    }
}
