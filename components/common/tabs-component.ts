import { Page, Locator, expect } from '@playwright/test';

export class TabsComponent {
    readonly root: Locator;
    private readonly testId: string;
    constructor(page: Page, testId: string) {
        this.testId = testId;
        this.root = page.locator(`[data-testid="${testId}"]`);
    }
    getTab(value: string): Locator {
        return this.root.locator(`[data-testid="${this.testId}__${value}"]`);
    }
    async clickTab(value: string) {
        await this.root.locator(`[data-testid$="__${value}"]`).click();
    }

    async verifyTabsVisible(values: string[]) {
        for (const v of values) {
            await expect(this.root.locator(`[data-testid$="__${v}"]`)).toBeVisible();
        }
    }
}
