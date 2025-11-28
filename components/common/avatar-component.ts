import { Page, Locator, expect } from '@playwright/test';

export class AvatarComponent {
    readonly root: Locator;
    readonly title: Locator;
    readonly subtitle: Locator;
    readonly sublink: Locator;
    readonly tooltip: Locator;

    constructor(page: Page, testId: string) {
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.title = page.locator(`[data-testid="${testId}-title"]`);
        this.subtitle = page.locator(`[data-testid="${testId}-subtitle"]`);
        this.sublink = page.locator(`[data-testid="${testId}-sublink"]`);
        this.tooltip = page.locator(`[data-testid="${testId}-sublink_tooltip"]`);
    }
}
