"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiSettingsEditValueModal = void 0;
const kpi_settings_edit_value_form_1 = require("../forms/kpi-settings-edit-value-form");
class KpiSettingsEditValueModal {
    page;
    tableName;
    actionType;
    value;
    trigger;
    modal;
    form;
    deleteButton;
    constructor(page, tableName, actionType, value) {
        this.page = page;
        this.tableName = tableName;
        this.actionType = actionType;
        this.value = value;
        const baseTestId = [tableName, actionType, value].filter(Boolean).join('__');
        this.trigger = page.locator(`[data-testid="${baseTestId}__edit"]`);
        this.modal = page.locator(`[data-testid="${baseTestId}__edit-modal"]`);
        this.deleteButton = page.locator(`[data-testid="${baseTestId}__delete"]`);
        this.form = new kpi_settings_edit_value_form_1.KpiSettingsEditValueForm(page, tableName, actionType, value);
    }
}
exports.KpiSettingsEditValueModal = KpiSettingsEditValueModal;
