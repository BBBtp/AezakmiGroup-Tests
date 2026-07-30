import { type Locator, type Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiSettingsTestIds } from '@locators/kpi-settings';
import { KpiSettingsAddValueForm } from '../forms/kpi-settings-add-value-form';

export type KpiSettingsAddValueTableName = 'ab-tests' | 'total-mrr';

export class KpiSettingsAddValueModal extends UiObject {
  readonly tableName: KpiSettingsAddValueTableName;

  readonly trigger: Locator;
  readonly modal: Locator;
  readonly progressStepActionType: Locator;
  readonly progressStepValue: Locator;
  readonly progressStepPoints: Locator;
  readonly backButton: Locator;
  readonly nextButton: Locator;
  readonly loadingIndicator: Locator;
  readonly errorBlock: Locator;
  readonly form: KpiSettingsAddValueForm;

  constructor(page: Page, tableName: KpiSettingsAddValueTableName) {
    super(page);
    this.tableName = kpiSettingsTestIds.table(tableName).root as KpiSettingsAddValueTableName;
    const testIds = kpiSettingsTestIds.addModal(this.tableName);

    this.trigger = this.locate.testId(testIds.trigger);
    this.modal = this.locate.testId(testIds.root);
    this.progressStepActionType = this.locate.testId(testIds.actionTypeStep);
    this.progressStepValue = this.locate.testId(testIds.valueStep);
    this.progressStepPoints = this.locate.testId(testIds.pointsStep);
    this.backButton = this.locate.testId(testIds.backButton);
    this.nextButton = this.locate.testId(testIds.nextButton);
    this.loadingIndicator = this.locate.testId(testIds.loading);
    const modal = this.locate.within(this.modal);
    this.errorBlock = modal.testId(testIds.error).or(modal.text('Failed to create value')).first();

    this.form = new KpiSettingsAddValueForm(page, this.tableName);
  }

  async waitForOpen(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: add modal`, this.modal);
    await this.expectations.visible(`${this.tableName}: add form`, this.form.root);
  }

  async expectShellVisible(): Promise<void> {
    await this.waitForOpen();
    await this.expectations.visible(`${this.tableName}: action type step`, this.progressStepActionType);
    await this.expectations.visible(`${this.tableName}: value step`, this.progressStepValue);
    await this.expectations.visible(`${this.tableName}: points step`, this.progressStepPoints);
    await this.expectations.visible(`${this.tableName}: action type select`, this.form.actionTypeSelect);
    await this.expectations.visible(`${this.tableName}: action type trigger`, this.form.actionTypeTrigger);
    await this.expectations.visible(`${this.tableName}: next action`, this.nextButton);
  }

  async clickNextSafely(): Promise<void> {
    await this.expectations.enabled(`${this.tableName}: next action`, this.nextButton);
    await this.actions.click(`KPI settings ${this.tableName}: next`, this.nextButton);
  }

  async clickBackSafely(): Promise<void> {
    await this.expectations.enabled(`${this.tableName}: back action`, this.backButton);
    await this.actions.click(`KPI settings ${this.tableName}: back`, this.backButton);
  }

  async assertNextEnabled(): Promise<void> {
    await this.expectations.enabled(`${this.tableName}: next action`, this.nextButton);
  }

  async assertNextDisabled(): Promise<void> {
    await this.expectations.disabled(`${this.tableName}: next action`, this.nextButton);
  }

  async assertBackEnabled(): Promise<void> {
    await this.expectations.enabled(`${this.tableName}: back action`, this.backButton);
  }

  async assertBackDisabled(): Promise<void> {
    await this.expectations.disabled(`${this.tableName}: back action`, this.backButton);
  }

  async assertAbTestsActionTypeStep(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: action type step`, this.progressStepActionType);
    await this.form.expectActionTypeControlsVisible();
    await this.form.expectValueControlsHidden();
    await this.form.expectPointsControlsHidden();
    await this.expectations.visible(`${this.tableName}: back action`, this.backButton);
    await this.assertNextDisabled();
    await this.expectations.hidden(`${this.tableName}: loading`, this.loadingIndicator);
    await this.expectations.hidden(`${this.tableName}: error`, this.errorBlock);
  }

  async assertTotalMrrActionTypeStep(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: action type step`, this.progressStepActionType);
    await this.form.expectActionTypeControlsVisible();
    await this.form.expectValueControlsHidden();
    await this.form.expectPointsControlsHidden();
    await this.assertBackDisabled();
    await this.assertNextDisabled();
    await this.expectations.hidden(`${this.tableName}: loading`, this.loadingIndicator);
    await this.expectations.hidden(`${this.tableName}: error`, this.errorBlock);
  }

  async assertActionTypeStepShell(): Promise<void> {
    if (this.tableName === 'total-mrr') {
      await this.assertTotalMrrActionTypeStep();
      return;
    }

    await this.assertAbTestsActionTypeStep();
  }

  async selectActionType(value: string): Promise<void> {
    await this.form.selectActionType(value);
  }

  async goToValueStep(): Promise<void> {
    await this.clickNextSafely();

    if (this.tableName === 'total-mrr') {
      await this.assertTotalMrrValueStep();
      return;
    }

    await this.assertAbTestsValueStep();
  }

  async assertAbTestsValueStep(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: value step`, this.progressStepValue);
    await this.form.expectValueControlsVisible();
    await this.assertNextDisabled();
    await this.expectations.hidden(`${this.tableName}: loading`, this.loadingIndicator);
    await this.expectations.hidden(`${this.tableName}: error`, this.errorBlock);
  }

  async assertAbTestsValueConfiguredStep(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: value step`, this.progressStepValue);
    await this.form.expectValueControlsVisible({ includeInput: true });
    await this.expectations.hidden(`${this.tableName}: loading`, this.loadingIndicator);
    await this.expectations.hidden(`${this.tableName}: error`, this.errorBlock);
  }

  async assertTotalMrrValueStep(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: value step`, this.progressStepValue);
    await this.form.expectActionTypeControlsHidden();
    await this.form.expectValueControlsVisible({ includeInput: true });
    await this.form.expectPointsControlsHidden();
    await this.assertBackEnabled();
    await this.assertNextDisabled();
    await this.expectations.hidden(`${this.tableName}: loading`, this.loadingIndicator);
    await this.expectations.hidden(`${this.tableName}: error`, this.errorBlock);
  }

  async assertTotalMrrValueConfiguredStep(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: value step`, this.progressStepValue);
    await this.form.expectActionTypeControlsHidden();
    await this.form.expectValueControlsVisible({ includeInput: true });
    await this.form.expectPointsControlsHidden();
    await this.assertBackEnabled();
    await this.expectations.hidden(`${this.tableName}: loading`, this.loadingIndicator);
    await this.expectations.hidden(`${this.tableName}: error`, this.errorBlock);
  }

  async assertValueStepShell(): Promise<void> {
    if (this.tableName === 'total-mrr') {
      await this.assertTotalMrrValueStep();
      return;
    }

    await this.assertAbTestsValueStep();
  }

  async selectValueType(value: string): Promise<void> {
    await this.form.openValueTypeSelect();

    if (this.tableName === 'total-mrr') {
      await this.form.expectValueTypeOptionsVisible(['Reached $N', 'Increased by N%', 'Fell by N%']);
    }

    await this.actions.click(
      `KPI settings ${this.tableName}: select value type ${value}`,
      this.form.valueTypeOption(value),
    );
    await this.expectations.containsText(
      `${this.tableName}: selected value type`,
      this.form.valueTypeTriggerValue,
      value,
    );
    await this.expectations.visible(`${this.tableName}: value input`, this.form.valueInput);
    await this.assertNextDisabled();
  }

  async fillValue(value: string): Promise<void> {
    await this.form.fillValue(value);
    await this.assertNextEnabled();
  }

  async selectPointsType(type: 'plus' | 'minus'): Promise<void> {
    const option = type === 'plus' ? this.form.pointsRadioPlus : this.form.pointsRadioMinus;
    await this.actions.click(`KPI settings ${this.tableName}: select points ${type}`, option);
  }

  async fillPoints(value: string): Promise<void> {
    await this.actions.fill(`KPI settings ${this.tableName}: fill points`, this.form.pointsInput, value);
    await this.assertNextEnabled();
  }

  async submitCreate(): Promise<void> {
    await this.clickNextSafely();
  }

  async goToPointsStep(): Promise<void> {
    await this.clickNextSafely();

    if (this.tableName === 'total-mrr') {
      await this.assertTotalMrrPointsStep();
      return;
    }

    await this.assertAbTestsPointsStep();
  }

  async assertAbTestsPointsStep(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: points step`, this.progressStepPoints);
    await this.form.expectPointsControlsVisible();
    await this.expectations.hidden(`${this.tableName}: loading`, this.loadingIndicator);
    await this.expectations.hidden(`${this.tableName}: error`, this.errorBlock);
  }

  async assertTotalMrrPointsStep(): Promise<void> {
    await this.expectations.visible(`${this.tableName}: points step`, this.progressStepPoints);
    await this.form.expectActionTypeControlsHidden();
    await this.form.expectValueControlsHidden();
    await this.form.expectPointsControlsVisible();
    await this.assertBackEnabled();
    await this.expectations.hidden(`${this.tableName}: loading`, this.loadingIndicator);
    await this.expectations.hidden(`${this.tableName}: error`, this.errorBlock);
  }

  async assertPointsStepShell(): Promise<void> {
    if (this.tableName === 'total-mrr') {
      await this.assertTotalMrrPointsStep();
      return;
    }

    await this.assertAbTestsPointsStep();
  }

  async goBackToValueStep(): Promise<void> {
    await this.clickBackSafely();

    if (this.tableName === 'total-mrr') {
      await this.assertTotalMrrValueConfiguredStep();
      return;
    }

    await this.assertAbTestsValueConfiguredStep();
  }

  async selectActionTypeAndGoToValueStep(actionType: string): Promise<void> {
    await this.assertActionTypeStepShell();
    await this.selectActionType(actionType);
    await this.assertNextEnabled();
    await this.clickNextSafely();
    await this.assertValueStepShell();
  }

  async selectValueTypeFillInputAndGoToPointsStep(valueType: string, value: string): Promise<void> {
    await this.assertValueStepShell();
    await this.selectValueType(valueType);
    await this.fillValue(value);
    await this.clickNextSafely();
    await this.assertPointsStepShell();
  }

  async runAbTestsAddModalFlow(actionType: string, valueType: string, value: string): Promise<void> {
    if (this.tableName !== 'ab-tests') {
      throw new Error('runAbTestsAddModalFlow can only be used with ab-tests modal');
    }

    await this.selectActionTypeAndGoToValueStep(actionType);
    await this.selectValueTypeFillInputAndGoToPointsStep(valueType, value);
  }

  async runTotalMrrAddModalFlow(actionType: string, valueType: string, value: string): Promise<void> {
    if (this.tableName !== 'total-mrr') {
      throw new Error('runTotalMrrAddModalFlow can only be used with total-mrr modal');
    }

    await this.selectActionTypeAndGoToValueStep(actionType);
    await this.selectValueTypeFillInputAndGoToPointsStep(valueType, value);
  }

  async backToValueStep(): Promise<void> {
    await this.goBackToValueStep();
  }
}
