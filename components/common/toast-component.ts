import { Page, Locator, expect } from '@playwright/test';

export class ToastComponent {
    readonly root: Locator;
    readonly title: Locator;
    readonly subtitle: Locator;
    constructor(page: Page, testId: string) {
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.title = this.root.locator(`[data-testid$="__alert-title"]`);
        this.subtitle = this.root.locator(`[data-testid$="__alert-subtitle"]`);
    }
}
