import { Locator, Page } from '@playwright/test';

export class KpiSettingsDeleteValueModal {
    readonly page: Page;
    readonly baseTestId: string;

    readonly modal: Locator;
    readonly confirmButton: Locator;
    readonly cancelButton: Locator;
    readonly loader: Locator;

    constructor(page: Page, tableName: string, actionType: string, value: string) {
        this.page = page;
        this.baseTestId = [tableName, actionType, value].filter(Boolean).join('__');

        this.modal = page.locator(`[data-testid="${this.baseTestId}__delete-modal"]`);
        this.confirmButton = page.locator('[data-testid="delete-item__del-btn"]');
        this.cancelButton = page.locator('[data-testid="delete-item__cancel-btn"]');
        this.loader = page.locator('[data-testid="delete-item__loader"]');
    }
}



