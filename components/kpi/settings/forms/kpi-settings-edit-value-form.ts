import { Locator, Page } from '@playwright/test';

export class KpiSettingsEditValueForm {
    readonly page: Page;
    readonly baseTestId: string;

    readonly root: Locator;
    readonly actionType: Locator;
    readonly valueType: Locator;
    readonly pointsRadio: Locator;
    readonly pointsRadioPlus: Locator;
    readonly pointsRadioMinus: Locator;
    readonly pointsInput: Locator;
    readonly pointsInputSign: Locator;
    readonly saveButton: Locator;
    readonly errorBlock: Locator;

    constructor(page: Page, tableName: string, actionType: string, value: string) {
        this.page = page;
        this.baseTestId = [tableName, actionType, value].filter(Boolean).join('__');

        this.root = page.locator(`[data-testid="${this.baseTestId}__edit-form"]`);
        this.actionType = page.locator(`[data-testid="${this.baseTestId}__actionType"]`);
        this.valueType = page.locator(`[data-testid="${this.baseTestId}__valueType"]`);
        this.pointsRadio = page.locator(`[data-testid="${this.baseTestId}__points-radio"]`);
        this.pointsRadioPlus = page.locator(`[data-testid="${this.baseTestId}__points-radio__plus"]`);
        this.pointsRadioMinus = page.locator(`[data-testid="${this.baseTestId}__points-radio__minus"]`);
        this.pointsInput = page.locator(`[data-testid="${this.baseTestId}__points-input"]`);
        this.pointsInputSign = page.locator(`[data-testid="${this.baseTestId}__points-input-sign"]`);
        this.saveButton = page.locator(`[data-testid="${this.baseTestId}__save"]`);
        this.errorBlock = page.locator(`[data-testid="${this.baseTestId}__error"]`);
    }
}



