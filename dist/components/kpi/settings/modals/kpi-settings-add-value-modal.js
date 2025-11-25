"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiSettingsAddValueModal = void 0;
const kpi_settings_add_value_form_1 = require("../forms/kpi-settings-add-value-form");
class KpiSettingsAddValueModal {
    page;
    tableName;
    trigger;
    modal;
    progressStepActionType;
    progressStepValue;
    progressStepPoints;
    backButton;
    nextButton;
    loadingIndicator;
    errorBlock;
    form;
    constructor(page, tableName) {
        this.page = page;
        this.tableName = tableName;
        this.trigger = page.locator(`[data-testid="${tableName}__add-value"]`);
        this.modal = page.locator(`[data-testid="${tableName}__add-modal"]`);
        this.progressStepActionType = page.locator(`[data-testid="${tableName}-Action type"]`);
        this.progressStepValue = page.locator(`[data-testid="${tableName}-Value"]`);
        this.progressStepPoints = page.locator(`[data-testid="${tableName}-Points"]`);
        this.backButton = page.locator(`[data-testid="${tableName}__button-prev"]`);
        this.nextButton = page.locator(`[data-testid="${tableName}__button-next"]`);
        this.loadingIndicator = page.locator(`[data-testid="${tableName}__loading"]`);
        this.errorBlock = page.locator(`[data-testid="${tableName}__error"]`);
        this.form = new kpi_settings_add_value_form_1.KpiSettingsAddValueForm(page, tableName);
    }
}
exports.KpiSettingsAddValueModal = KpiSettingsAddValueModal;
