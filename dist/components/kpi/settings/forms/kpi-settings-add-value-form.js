"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiSettingsAddValueForm = void 0;
class KpiSettingsAddValueForm {
    page;
    tableName;
    root;
    actionTypeSelect;
    actionTypeTrigger;
    actionTypeContent;
    valueBlock;
    valueTypeSelect;
    valueTypeTrigger;
    valueTypeContent;
    valueInput;
    pointsBlock;
    pointsRadio;
    pointsRadioPlus;
    pointsRadioMinus;
    pointsInput;
    constructor(page, tableName) {
        this.page = page;
        this.tableName = tableName;
        this.root = page.locator(`[data-testid="${tableName}__add-form"]`);
        this.actionTypeSelect = this.root.locator('[data-testid="action-type-select"]');
        this.actionTypeTrigger = this.root.locator('[data-testid="action-type-select-trigger"]');
        this.actionTypeContent = this.root.locator('[data-testid="action-type-select-content"]');
        this.valueBlock = this.root.locator('[data-testid="value-block"]');
        this.valueTypeSelect = this.root.locator('[data-testid="value-type-select"]');
        this.valueTypeTrigger = this.root.locator('[data-testid="value-type-select-trigger"]');
        this.valueTypeContent = this.root.locator('[data-testid="value-type-select-content"]');
        this.valueInput = this.root.locator('[data-testid="value-input"]');
        this.pointsBlock = this.root.locator('[data-testid="points-block"]');
        this.pointsRadio = this.root.locator('[data-testid="points-radio"]');
        this.pointsRadioPlus = this.root.locator('[data-testid="points-radio__plus"]');
        this.pointsRadioMinus = this.root.locator('[data-testid="points-radio__minus"]');
        this.pointsInput = this.root.locator('[data-testid="points-input"]');
    }
    actionTypeOption(value) {
        return this.root.locator(`[data-testid="action-type-select_option-${value}"]`);
    }
    valueTypeOption(value) {
        return this.root.locator(`[data-testid="value-type-select_option-${value}"]`);
    }
}
exports.KpiSettingsAddValueForm = KpiSettingsAddValueForm;
