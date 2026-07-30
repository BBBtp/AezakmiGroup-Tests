import { type Locator, type Page, expect } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { requireTestId } from '../../../../utils/test-id';

export class KpiSettingsAddValueForm extends UiObject {
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
    super(page);
    this.tableName = requireTestId(tableName, 'KpiSettingsAddValueForm');
    this.root = this.locate.testId(`${this.tableName}__add-form`);
    const form = this.locate.within(this.root);
    this.actionTypeSelect = form.testId('action-type-select');
    this.actionTypeTrigger = form.testId('action-type-select-trigger');
    // Content for select-like controls is rendered outside the form subtree.
    this.actionTypeContent = this.locate.testId('action-type-select-content');
    this.actionTypeTriggerValue = this.locate.testId('action-type-select-trigger-value');
    this.valueBlock = form.testId('value-block');
    this.valueTypeSelect = form.testId('value-type-select');
    this.valueTypeTrigger = form.testId('value-type-select-trigger');
    this.valueTypeTriggerValue = this.locate.testId('value-type-select-trigger-value');
    this.valueTypeContent = this.locate.testId('value-type-select-content');
    this.valueInput = form.testId('value-input');
    this.pointsBlock = form.testId('points-block');
    this.pointsRadio = form.testId('points-radio');
    this.pointsRadioPlus = form.testId('points-radio__plus');
    this.pointsRadioMinus = form.testId('points-radio__minus');
    this.pointsInput = form.testId('points-input');
  }
  actionTypeOption(value: string): Locator {
    return this.locate.testId(`action-type-select_option-${value}`);
  }
  valueTypeOption(value: string): Locator {
    return this.locate.testId(`value-type-select_option-${value}`);
  }

  async openActionTypeSelect(): Promise<void> {
    await this.actions.click(`KPI settings ${this.tableName}: open action type`, this.actionTypeTrigger);
    await expect(this.actionTypeContent).toBeVisible();
  }

  async openValueTypeSelect(): Promise<void> {
    await this.actions.click(`KPI settings ${this.tableName}: open value type`, this.valueTypeTrigger);
    await expect(this.valueTypeContent).toBeVisible();
  }

  async selectActionType(value: string): Promise<void> {
    await this.openActionTypeSelect();
    await this.actions.click(
      `KPI settings ${this.tableName}: select action type ${value}`,
      this.actionTypeOption(value),
    );
    await expect(this.actionTypeTriggerValue).toContainText(value);
  }

  async selectValueType(value: string): Promise<void> {
    await this.openValueTypeSelect();
    await this.actions.click(
      `KPI settings ${this.tableName}: select value type ${value}`,
      this.valueTypeOption(value),
    );
    await expect(this.valueTypeTriggerValue).toContainText(value);
  }

  async fillValue(value: string): Promise<void> {
    await this.actions.fill(`KPI settings ${this.tableName}: fill value`, this.valueInput, value);
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
