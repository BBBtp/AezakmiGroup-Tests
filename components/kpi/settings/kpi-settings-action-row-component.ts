import { Locator, Page, expect } from '@playwright/test';

export class KpiSettingsActionRowComponent {
    readonly page: Page;
    readonly tableName: string;
    readonly actionType: string;
    readonly value: string;

    readonly baseTestId: string;
    readonly root: Locator;
    readonly editButton: Locator;
    readonly deleteButton: Locator;
    readonly actionButtons: Locator;
    readonly toast: Locator;
    readonly toastTitle: Locator;
    readonly toastSubtitle: Locator;

    readonly editModal: Locator;
    readonly editForm: Locator;
    readonly deleteModal: Locator;

    readonly pointsRadioGroup: Locator;
    readonly pointsRadioPlus: Locator;
    readonly pointsRadioMinus: Locator;
    readonly pointsInput: Locator;
    readonly pointsInputSign: Locator;
    readonly saveButton: Locator;
    readonly errorBlock: Locator;

    constructor(page: Page, tableName: string, actionType: string, value: string) {
        this.page = page;
        this.tableName = tableName;
        this.actionType = actionType;
        this.value = value;

        this.baseTestId = this.composeTestId(tableName, actionType, value);
        this.root = page.locator(`[data-testid="${this.baseTestId}"]`);
        this.editButton = page.locator(`[data-testid="${this.baseTestId}__edit"]`);
        this.deleteButton = page.locator(`[data-testid="${this.baseTestId}__delete"]`);
        this.actionButtons = page.locator(`[data-testid="${this.baseTestId}__action-buttons"]`);

        this.toast = page.locator(`[data-testid="${this.baseTestId}__alert"]`);
        this.toastTitle = page.locator(`[data-testid="${this.baseTestId}__alert-title"]`);
        this.toastSubtitle = page.locator(`[data-testid="${this.baseTestId}__alert-subtitle"]`);

        this.editModal = page.locator(`[data-testid="${this.baseTestId}__edit-modal"]`);
        this.editForm = page.locator(`[data-testid="${this.baseTestId}__edit-form"]`);
        this.deleteModal = page.locator(`[data-testid="${this.baseTestId}__delete-modal"]`);

        this.pointsRadioGroup = page.locator(`[data-testid="${this.baseTestId}__points-radio"]`);
        this.pointsRadioPlus = page.locator(`[data-testid="${this.baseTestId}__points-radio__plus"]`);
        this.pointsRadioMinus = page.locator(`[data-testid="${this.baseTestId}__points-radio__minus"]`);
        this.pointsInput = page.locator(`[data-testid="${this.baseTestId}__points-input"]`);
        this.pointsInputSign = page.locator(`[data-testid="${this.baseTestId}__points-input-sign"]`);
        this.saveButton = page.locator(`[data-testid="${this.baseTestId}__save"]`);
        this.errorBlock = page.locator(`[data-testid="${this.baseTestId}__error"]`);
    }

    composeTestId(...parts: string[]): string {
        return parts.filter(Boolean).join('__');
    }

    async expectVisible(): Promise<void> {
        await expect(this.root).toBeVisible();
        await expect(this.editButton).toBeVisible();
        await expect(this.deleteButton).toBeVisible();
    }
}



