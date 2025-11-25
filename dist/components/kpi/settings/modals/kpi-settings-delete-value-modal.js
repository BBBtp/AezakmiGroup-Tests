"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiSettingsDeleteValueModal = void 0;
class KpiSettingsDeleteValueModal {
    page;
    baseTestId;
    modal;
    confirmButton;
    cancelButton;
    loader;
    constructor(page, tableName, actionType, value) {
        this.page = page;
        this.baseTestId = [tableName, actionType, value].filter(Boolean).join('__');
        this.modal = page.locator(`[data-testid="${this.baseTestId}__delete-modal"]`);
        this.confirmButton = page.locator('[data-testid="delete-item__del-btn"]');
        this.cancelButton = page.locator('[data-testid="delete-item__cancel-btn"]');
        this.loader = page.locator('[data-testid="delete-item__loader"]');
    }
}
exports.KpiSettingsDeleteValueModal = KpiSettingsDeleteValueModal;
