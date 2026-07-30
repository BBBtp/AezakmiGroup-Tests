import { type Locator, type Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiSettingsTestIds } from '@locators/kpi-settings';

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
    const testIds = kpiSettingsTestIds.addForm(tableName);
    this.tableName = kpiSettingsTestIds.table(tableName).root;
    this.root = this.locate.testId(testIds.root);
    const form = this.locate.within(this.root);
    this.actionTypeSelect = form.testId(testIds.actionTypeSelect);
    this.actionTypeTrigger = form.testId(testIds.actionTypeTrigger);
    // Content for select-like controls is rendered outside the form subtree.
    this.actionTypeContent = this.locate.testId(testIds.actionTypeContent);
    this.actionTypeTriggerValue = this.locate.testId(testIds.actionTypeTriggerValue);
    this.valueBlock = form.testId(testIds.valueBlock);
    this.valueTypeSelect = form.testId(testIds.valueTypeSelect);
    this.valueTypeTrigger = form.testId(testIds.valueTypeTrigger);
    this.valueTypeTriggerValue = this.locate.testId(testIds.valueTypeTriggerValue);
    this.valueTypeContent = this.locate.testId(testIds.valueTypeContent);
    this.valueInput = form.testId(testIds.valueInput);
    this.pointsBlock = form.testId(testIds.pointsBlock);
    this.pointsRadio = form.testId(testIds.pointsRadio);
    this.pointsRadioPlus = form.testId(testIds.pointsRadioPlus);
    this.pointsRadioMinus = form.testId(testIds.pointsRadioMinus);
    this.pointsInput = form.testId(testIds.pointsInput);
  }
  actionTypeOption(value: string): Locator {
    return this.locate.testId(kpiSettingsTestIds.addForm(this.tableName).actionTypeOption(value));
  }
  valueTypeOption(value: string): Locator {
    return this.locate.testId(kpiSettingsTestIds.addForm(this.tableName).valueTypeOption(value));
  }

  async openActionTypeSelect(): Promise<void> {
    await this.actions.click(`KPI settings ${this.tableName}: open action type`, this.actionTypeTrigger);
    await this.expectations.visible(`${this.tableName}: action type options`, this.actionTypeContent);
  }

  async openValueTypeSelect(): Promise<void> {
    await this.actions.click(`KPI settings ${this.tableName}: open value type`, this.valueTypeTrigger);
    await this.expectations.visible(`${this.tableName}: value type options`, this.valueTypeContent);
  }

  async selectActionType(value: string): Promise<void> {
    await this.openActionTypeSelect();
    await this.actions.click(
      `KPI settings ${this.tableName}: select action type ${value}`,
      this.actionTypeOption(value),
    );
    await this.expectations.containsText(
      `${this.tableName}: selected action type`,
      this.actionTypeTriggerValue,
      value,
    );
  }

  async selectValueType(value: string): Promise<void> {
    await this.openValueTypeSelect();
    await this.actions.click(
      `KPI settings ${this.tableName}: select value type ${value}`,
      this.valueTypeOption(value),
    );
    await this.expectations.containsText(
      `${this.tableName}: selected value type`,
      this.valueTypeTriggerValue,
      value,
    );
  }

  async fillValue(value: string): Promise<void> {
    await this.actions.fill(`KPI settings ${this.tableName}: fill value`, this.valueInput, value);
  }

  async expectActionTypeControlsVisible(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: action type select`, this.actionTypeSelect);
    await this.expectations.visible(`${this.tableName}: action type trigger`, this.actionTypeTrigger);
    await this.expectations.visible(`${this.tableName}: action type value`, this.actionTypeTriggerValue);
  }

  async expectValueControlsVisible(options: { includeInput?: boolean } = {}): Promise<void> {
    await this.expectations.visible(`${this.tableName}: value block`, this.valueBlock);
    await this.expectations.visible(`${this.tableName}: value type select`, this.valueTypeSelect);
    await this.expectations.visible(`${this.tableName}: value type trigger`, this.valueTypeTrigger);
    await this.expectations.visible(`${this.tableName}: value type value`, this.valueTypeTriggerValue);

    if (options.includeInput ?? false) {
      await this.expectations.visible(`${this.tableName}: value input`, this.valueInput);
    }
  }

  async expectPointsControlsVisible(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: points block`, this.pointsBlock);
    await this.expectations.visible(`${this.tableName}: points radio`, this.pointsRadio);
    await this.expectations.visible(`${this.tableName}: plus points`, this.pointsRadioPlus);
    await this.expectations.visible(`${this.tableName}: minus points`, this.pointsRadioMinus);
    await this.expectations.visible(`${this.tableName}: points input`, this.pointsInput);
  }

  async expectValueTypeOptionsVisible(values: string[]): Promise<void> {
    for (const value of values) {
      await this.expectations.visible(
        `${this.tableName}: value type option ${value}`,
        this.valueTypeOption(value),
      );
    }
  }

  async expectActionTypeControlsHidden(): Promise<void> {
    await this.expectations.count(`${this.tableName}: action type select`, this.actionTypeSelect, 0);
    await this.expectations.count(`${this.tableName}: action type trigger`, this.actionTypeTrigger, 0);
  }

  async expectValueControlsHidden(): Promise<void> {
    await this.expectations.count(`${this.tableName}: value block`, this.valueBlock, 0);
  }

  async expectPointsControlsHidden(): Promise<void> {
    await this.expectations.count(`${this.tableName}: points block`, this.pointsBlock, 0);
  }
}
