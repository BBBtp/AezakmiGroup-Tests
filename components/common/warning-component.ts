import { Page, Locator, expect } from '@playwright/test';

export class WarningComponent {
    readonly root: Locator;

    constructor(page: Page, testId = 'month-end-warning') {
        this.root = page.locator(`[data-testid="${testId}"]`);
    }
}
