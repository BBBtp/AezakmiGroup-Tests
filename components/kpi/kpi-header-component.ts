import { Page, Locator, expect } from '@playwright/test';

export class KpiHeaderComponent {
    readonly root: Locator;
    readonly settingsButton: Locator;
    readonly subtitle: Locator;
    readonly errorBlock: Locator;

    constructor(page: Page) {
        this.root = page.locator('[data-testid="kpi"]');
        this.settingsButton = this.root.locator('[data-testid="settings-button"]');
        this.subtitle = this.root.locator('[data-testid="subtitle"]');
        this.errorBlock = this.root.locator('[data-testid="error-content"]');
    }

}
