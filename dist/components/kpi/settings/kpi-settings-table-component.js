"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiSettingsTableComponent = void 0;
const kpi_settings_action_row_component_1 = require("./kpi-settings-action-row-component");
class KpiSettingsTableComponent {
    page;
    tableName;
    root;
    table;
    headerRow;
    actionTypeHeader;
    pointsHeader;
    valueHeader;
    pointsLabel;
    tableBody;
    footerBar;
    addValueButton;
    addModal;
    addForm;
    addModalStepActionType;
    addModalStepValue;
    addModalStepPoints;
    addModalPrevButton;
    addModalNextButton;
    addModalLoading;
    addModalError;
    options;
    constructor(page, tableName, options = {}) {
        this.page = page;
        this.tableName = tableName;
        this.options = {
            hasValueColumn: options.hasValueColumn ?? true,
            hasFooterBar: options.hasFooterBar ?? true,
        };
        this.root = page.locator(`[data-testid="${tableName}"]`);
        this.table = page.locator(`[data-testid="${tableName}__table"]`);
        this.headerRow = page.locator(`[data-testid="${tableName}__table-header-row"]`);
        this.actionTypeHeader = page.locator(`[data-testid="${tableName}__action-type-header"]`);
        this.pointsHeader = page.locator(`[data-testid="${tableName}__points-header"]`);
        this.pointsLabel = page.locator(`[data-testid="${tableName}__points-label"]`);
        this.tableBody = page.locator(`[data-testid="${tableName}__table-body"]`);
        if (this.options.hasValueColumn) {
            this.valueHeader = page.locator(`[data-testid="${tableName}__value-header"]`);
        }
        if (this.options.hasFooterBar) {
            this.footerBar = page.locator(`[data-testid="${tableName}__table-bar"]`);
        }
        this.addValueButton = page.locator(`[data-testid="${tableName}__add-value"]`);
        this.addModal = page.locator(`[data-testid="${tableName}__add-modal"]`);
        this.addForm = page.locator(`[data-testid="${tableName}__add-form"]`);
        this.addModalStepActionType = page.locator(`[data-testid="${tableName}-Action type"]`);
        this.addModalStepValue = page.locator(`[data-testid="${tableName}-Value"]`);
        this.addModalStepPoints = page.locator(`[data-testid="${tableName}-Points"]`);
        this.addModalPrevButton = page.locator(`[data-testid="${tableName}__button-prev"]`);
        this.addModalNextButton = page.locator(`[data-testid="${tableName}__button-next"]`);
        this.addModalLoading = page.locator(`[data-testid="${tableName}__loading"]`);
        this.addModalError = page.locator(`[data-testid="${tableName}__error"]`);
    }
    createActionRow(actionType, value) {
        return new kpi_settings_action_row_component_1.KpiSettingsActionRowComponent(this.page, this.tableName, actionType, value);
    }
}
exports.KpiSettingsTableComponent = KpiSettingsTableComponent;
