import { Locator, Page, expect } from '@playwright/test';
import { KpiSettingsTableComponent } from './kpi-settings-table-component';

export class KpiSettingsScoreComponent extends KpiSettingsTableComponent {
    readonly sufficientScoreEditButton: Locator;
    readonly minimalScoreEditButton: Locator;
    constructor(page: Page) {
        super(page, 'score', { hasValueColumn: false, hasFooterBar: false });
        this.sufficientScoreEditButton = page.locator('[data-testid="score__Sufficient score__edit"]');
        this.minimalScoreEditButton = page.locator('[data-testid="score__Minimal score__edit"]');
    }

    async expectReadOnlyShellVisible(): Promise<void> {
        await expect(this.root).toBeVisible();
        await expect(this.table).toBeVisible();
        await expect(this.headerRow).toBeVisible();
        await expect(this.actionTypeHeader).toBeVisible();
        await expect(this.pointsHeader).toBeVisible();
        await expect(this.pointsLabel).toBeVisible();
        await expect(this.tableBody).toBeVisible();
        await expect(this.sufficientScoreEditButton).toBeVisible();
        await expect(this.minimalScoreEditButton).toBeVisible();
        await expect(this.sufficientScoreEditButton).toBeDisabled();
        await expect(this.minimalScoreEditButton).toBeDisabled();
    }
}


