"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiSettingsActionRowComponent = void 0;
const test_1 = require("@playwright/test");
class KpiSettingsActionRowComponent {
    page;
    tableName;
    actionType;
    value;
    baseTestId;
    root;
    editButton;
    deleteButton;
    actionButtons;
    toast;
    toastTitle;
    toastSubtitle;
    editModal;
    editForm;
    deleteModal;
    pointsRadioGroup;
    pointsRadioPlus;
    pointsRadioMinus;
    pointsInput;
    pointsInputSign;
    saveButton;
    errorBlock;
    constructor(page, tableName, actionType, value) {
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
    composeTestId(...parts) {
        return parts.filter(Boolean).join('__');
    }
    async expectVisible() {
        await (0, test_1.expect)(this.root).toBeVisible();
        await (0, test_1.expect)(this.editButton).toBeVisible();
        await (0, test_1.expect)(this.deleteButton).toBeVisible();
    }
}
exports.KpiSettingsActionRowComponent = KpiSettingsActionRowComponent;
