import { Locator, Page, expect } from '@playwright/test';
import { requireTestId } from '../../../../utils/test-id';
import { loggedClick, loggedFill } from '../../../../utils/playwright-logger';

export class KpiSettingsAddValueForm {
    readonly page: Page;
    readonly tableName: string;
    readonly root: Locator;
    readonly actionTypeSelect: Locator;
    readonly actionTypeTrigger: Locator;
    readonly actionTypeTriggerValue: Locator;
    readonly actionTypeContent: Locator;
    readonly valueBlock: Locator;
    readonly valueTypeSelect: Locator;
    readonly valueTypeTrigger: Locator;
    readonly valueTypeTriggerValue: Locator;
    readonly valueTypeContent: Locator;
    readonly valueInput: Locator;
    readonly pointsBlock: Locator;
    readonly pointsRadio: Locator;
    readonly pointsRadioPlus: Locator;
    readonly pointsRadioMinus: Locator;
    readonly pointsInput: Locator;

    constructor(page: Page, tableName: string) {
        this.page = page;
        this.tableName = requireTestId(tableName, 'KpiSettingsAddValueForm');
        this.root = page.locator(`[data-testid="${this.tableName}__add-form"]`);
        this.actionTypeSelect = this.root.locator('[data-testid="action-type-select"]');
        this.actionTypeTrigger = this.root.locator('[data-testid="action-type-select-trigger"]');
        // Content for select-like controls is rendered outside the form subtree.
        this.actionTypeContent = this.page.locator('[data-testid="action-type-select-content"]');
        this.actionTypeTriggerValue = this.page.locator('[data-testid="action-type-select-trigger-value"]');
        this.valueBlock = this.root.locator('[data-testid="value-block"]');
        this.valueTypeSelect = this.root.locator('[data-testid="value-type-select"]');
        this.valueTypeTrigger = this.root.locator('[data-testid="value-type-select-trigger"]');
        this.valueTypeTriggerValue = this.page.locator('[data-testid="value-type-select-trigger-value"]');
        this.valueTypeContent = this.page.locator('[data-testid="value-type-select-content"]');
        this.valueInput = this.root.locator('[data-testid="value-input"]');
        this.pointsBlock = this.root.locator('[data-testid="points-block"]');
        this.pointsRadio = this.root.locator('[data-testid="points-radio"]');
        this.pointsRadioPlus = this.root.locator('[data-testid="points-radio__plus"]');
        this.pointsRadioMinus = this.root.locator('[data-testid="points-radio__minus"]');
        this.pointsInput = this.root.locator('[data-testid="points-input"]');
    }
    actionTypeOption(value: string): Locator {
        return this.page.locator(`[data-testid="action-type-select_option-${value}"]`);
    }
    valueTypeOption(value: string): Locator {
        return this.page.locator(`[data-testid="value-type-select_option-${value}"]`);
    }

    async openActionTypeSelect(): Promise<void> {
        await loggedClick(this.page, `KPI settings ${this.tableName}: open action type`, this.actionTypeTrigger);
        await expect(this.actionTypeContent).toBeVisible();
    }

    async openValueTypeSelect(): Promise<void> {
        await loggedClick(this.page, `KPI settings ${this.tableName}: open value type`, this.valueTypeTrigger);
        await expect(this.valueTypeContent).toBeVisible();
    }

    async selectActionType(value: string): Promise<void> {
        await this.openActionTypeSelect();
        await loggedClick(this.page, `KPI settings ${this.tableName}: select action type ${value}`, this.actionTypeOption(value));
        await expect(this.actionTypeTriggerValue).toContainText(value);
    }

    async selectValueType(value: string): Promise<void> {
        await this.openValueTypeSelect();
        await loggedClick(this.page, `KPI settings ${this.tableName}: select value type ${value}`, this.valueTypeOption(value));
        await expect(this.valueTypeTriggerValue).toContainText(value);
    }

    async fillValue(value: string): Promise<void> {
        await loggedFill(this.page, `KPI settings ${this.tableName}: fill value`, this.valueInput, value);
    }

    async expectActionTypeControlsVisible(): Promise<void> {
        await expect(this.actionTypeSelect).toBeVisible();
        await expect(this.actionTypeTrigger).toBeVisible();
        await expect(this.actionTypeTriggerValue).toBeVisible();
    }

    async expectValueControlsVisible(options: { includeInput?: boolean } = {}): Promise<void> {
        await expect(this.valueBlock).toBeVisible();
        await expect(this.valueTypeSelect).toBeVisible();
        await expect(this.valueTypeTrigger).toBeVisible();
        await expect(this.valueTypeTriggerValue).toBeVisible();

        if (options.includeInput ?? false) {
            await expect(this.valueInput).toBeVisible();
        }
    }

    async expectPointsControlsVisible(): Promise<void> {
        await expect(this.pointsBlock).toBeVisible();
        await expect(this.pointsRadio).toBeVisible();
        await expect(this.pointsRadioPlus).toBeVisible();
        await expect(this.pointsRadioMinus).toBeVisible();
        await expect(this.pointsInput).toBeVisible();
    }

    async expectValueTypeOptionsVisible(values: string[]): Promise<void> {
        for (const value of values) {
            await expect(this.valueTypeOption(value)).toBeVisible();
        }
    }

    async expectActionTypeControlsHidden(): Promise<void> {
        await expect(this.actionTypeSelect).toHaveCount(0);
        await expect(this.actionTypeTrigger).toHaveCount(0);
    }

    async expectValueControlsHidden(): Promise<void> {
        await expect(this.valueBlock).toHaveCount(0);
    }

    async expectPointsControlsHidden(): Promise<void> {
        await expect(this.pointsBlock).toHaveCount(0);
    }
}
