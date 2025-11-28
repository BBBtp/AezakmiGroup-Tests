import { Page, Locator, expect } from '@playwright/test';


export class FilterFormComponent {
    readonly page: Page;
    readonly root: Locator;
    private readonly testId: string;

    readonly applyButton: Locator;
    readonly resetButton: Locator;

    constructor(page: Page, testId: string = 'filter-form') {
        this.page = page;
        this.testId = testId;
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.applyButton = page.locator(`[data-testid="${testId}__apply"]`);
        this.resetButton = page.locator(`[data-testid="${testId}__reset"]`);
    }

    async waitForReady(): Promise<void> {
        await expect(this.root).toBeVisible();
    }

    async setInputValue(name: string, value: string): Promise<void> {
        const input = this.page.locator(`[data-testid="${this.testId}__input-${name}"]`);
        await input.fill(value);
    }

    async selectValue(name: string, value: string): Promise<void> {
        const select = this.page.locator(`[data-testid="${this.testId}__select-${name}"]`);
        await select.selectOption({ label: value });
    }

    async apply(): Promise<void> {
        await this.applyButton.click();
    }

    async reset(): Promise<void> {
        await this.resetButton.click();
    }

    async verifyFiltersApplied(): Promise<void> {
        await expect(this.page.locator('[data-testid="main-content"]')).toBeVisible();
    }
}
