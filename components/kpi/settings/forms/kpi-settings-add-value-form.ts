import { Locator, Page } from '@playwright/test';

export class KpiSettingsAddValueForm {
    readonly page: Page;
    readonly tableName: string;
    readonly root: Locator;

    readonly actionTypeSelect: Locator;
    readonly actionTypeTrigger: Locator;
    readonly actionTypeContent: Locator;

    readonly valueBlock: Locator;
    readonly valueTypeSelect: Locator;
    readonly valueTypeTrigger: Locator;
    readonly valueTypeContent: Locator;
    readonly valueInput: Locator;

    readonly pointsBlock: Locator;
    readonly pointsRadio: Locator;
    readonly pointsRadioPlus: Locator;
    readonly pointsRadioMinus: Locator;
    readonly pointsInput: Locator;

    constructor(page: Page, tableName: string) {
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

    actionTypeOption(value: string): Locator {
        return this.root.locator(`[data-testid="action-type-select_option-${value}"]`);
    }

    valueTypeOption(value: string): Locator {
        return this.root.locator(`[data-testid="value-type-select_option-${value}"]`);
    }
}



