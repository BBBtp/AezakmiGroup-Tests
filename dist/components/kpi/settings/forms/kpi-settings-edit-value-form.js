"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiSettingsEditValueForm = void 0;
class KpiSettingsEditValueForm {
    page;
    baseTestId;
    root;
    actionType;
    valueType;
    pointsRadio;
    pointsRadioPlus;
    pointsRadioMinus;
    pointsInput;
    pointsInputSign;
    saveButton;
    errorBlock;
    constructor(page, tableName, actionType, value) {
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
exports.KpiSettingsEditValueForm = KpiSettingsEditValueForm;
