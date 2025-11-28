import { Locator, Page, expect } from '@playwright/test';
import { KpiSettingsTableComponent } from './kpi-settings-table-component';

export class KpiSettingsScoreComponent extends KpiSettingsTableComponent {
    readonly sufficientScoreBlock: Locator;
    readonly sufficientScoreEditButton: Locator;
    readonly sufficientScoreValue: Locator;
    readonly minimalScoreBlock: Locator;
    readonly minimalScoreEditButton: Locator;
    readonly minimalScoreValue: Locator;
    constructor(page: Page) {
        super(page, 'score', { hasValueColumn: false, hasFooterBar: false });
        this.sufficientScoreBlock = page.locator('[data-testid="score__Sufficient score"]');
        this.sufficientScoreEditButton = page.locator('[data-testid="score__Sufficient score__edit"]');
        this.sufficientScoreValue = page.locator('[data-testid="score__Sufficient score__min-score"]');
        this.minimalScoreBlock = page.locator('[data-testid="score__Minimal score"]');
        this.minimalScoreEditButton = page.locator('[data-testid="score__Minimal score__edit"]');
        this.minimalScoreValue = page.locator('[data-testid="score__Minimal score__min-score"]');
    }

    async expectCoreValuesVisible(): Promise<void> {
        await expect(this.sufficientScoreBlock).toBeVisible();
        await expect(this.sufficientScoreEditButton).toBeVisible();
        await expect(this.sufficientScoreValue).toBeVisible();
        await expect(this.minimalScoreBlock).toBeVisible();
        await expect(this.minimalScoreEditButton).toBeVisible();
        await expect(this.minimalScoreValue).toBeVisible();
    }
}



