import { Page, Locator, expect } from '@playwright/test';

export class DescriptionComponent {
    readonly root: Locator;
    readonly title: Locator;
    readonly message: Locator;
    constructor(page: Page, testId: string) {
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.title = this.root.locator(`[data-testid="${testId}__title"]`);
        this.message = this.root.locator(`[data-testid="${testId}__message"]`);
    }
}
