import { type Locator, type Page, expect } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { KpiSettingsAddValueForm } from '../forms/kpi-settings-add-value-form';
import { requireTestId } from '../../../../utils/test-id';

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
    this.tableName = requireTestId(tableName, 'KpiSettingsAddValueModal') as KpiSettingsAddValueTableName;

    this.trigger = this.locate.testId(`${this.tableName}__add-value`);
    this.modal = this.locate.testId(`${this.tableName}__add-modal`);
    this.progressStepActionType = this.locate.testId(`${this.tableName}-Action type`);
    this.progressStepValue = this.locate.testId(`${this.tableName}-Value`);
    this.progressStepPoints = this.locate.testId(`${this.tableName}-Points`);
    this.backButton = this.locate.testId(`${this.tableName}__button-prev`);
    this.nextButton = this.locate.testId(`${this.tableName}__button-next`);
    this.loadingIndicator = this.locate.testId(`${this.tableName}__loading`);
    const modal = this.locate.within(this.modal);
    this.errorBlock = modal
      .testId(`${this.tableName}__error`)
      .or(modal.text('Failed to create value'))
      .first();

    this.form = new KpiSettingsAddValueForm(page, this.tableName);
  }

  async waitForOpen(): Promise<void> {
    await expect(this.modal).toBeVisible();
    await expect(this.form.root).toBeVisible();
  }

  async expectShellVisible(): Promise<void> {
    await this.waitForOpen();
    await expect(this.progressStepActionType).toBeVisible();
    await expect(this.progressStepValue).toBeVisible();
    await expect(this.progressStepPoints).toBeVisible();
    await expect(this.form.actionTypeSelect).toBeVisible();
    await expect(this.form.actionTypeTrigger).toBeVisible();
    await expect(this.nextButton).toBeVisible();
  }

  async clickNextSafely(): Promise<void> {
    await expect(this.nextButton).toBeEnabled();
    await this.actions.click(`KPI settings ${this.tableName}: next`, this.nextButton);
  }

  async clickBackSafely(): Promise<void> {
    await expect(this.backButton).toBeEnabled();
    await this.actions.click(`KPI settings ${this.tableName}: back`, this.backButton);
  }

  async assertNextEnabled(): Promise<void> {
    await expect(this.nextButton).toBeEnabled();
  }

  async assertNextDisabled(): Promise<void> {
    await expect(this.nextButton).toBeDisabled();
  }

  async assertBackEnabled(): Promise<void> {
    await expect(this.backButton).toBeEnabled();
  }

  async assertBackDisabled(): Promise<void> {
    await expect(this.backButton).toBeDisabled();
  }

  async assertAbTestsActionTypeStep(): Promise<void> {
    await expect(this.progressStepActionType).toBeVisible();
    await this.form.expectActionTypeControlsVisible();
    await this.form.expectValueControlsHidden();
    await this.form.expectPointsControlsHidden();
    await expect(this.backButton).toBeVisible();
    await this.assertNextDisabled();
    await expect(this.loadingIndicator).toBeHidden();
    await expect(this.errorBlock).toBeHidden();
  }

  async assertTotalMrrActionTypeStep(): Promise<void> {
    await expect(this.progressStepActionType).toBeVisible();
    await this.form.expectActionTypeControlsVisible();
    await this.form.expectValueControlsHidden();
    await this.form.expectPointsControlsHidden();
    await this.assertBackDisabled();
    await this.assertNextDisabled();
    await expect(this.loadingIndicator).toBeHidden();
    await expect(this.errorBlock).toBeHidden();
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
    await expect(this.progressStepValue).toBeVisible();
    await this.form.expectValueControlsVisible();
    await this.assertNextDisabled();
    await expect(this.loadingIndicator).toBeHidden();
    await expect(this.errorBlock).toBeHidden();
  }

  async assertAbTestsValueConfiguredStep(): Promise<void> {
    await expect(this.progressStepValue).toBeVisible();
    await this.form.expectValueControlsVisible({ includeInput: true });
    await expect(this.loadingIndicator).toBeHidden();
    await expect(this.errorBlock).toBeHidden();
  }

  async assertTotalMrrValueStep(): Promise<void> {
    await expect(this.progressStepValue).toBeVisible();
    await this.form.expectActionTypeControlsHidden();
    await this.form.expectValueControlsVisible({ includeInput: true });
    await this.form.expectPointsControlsHidden();
    await this.assertBackEnabled();
    await this.assertNextDisabled();
    await expect(this.loadingIndicator).toBeHidden();
    await expect(this.errorBlock).toBeHidden();
  }

  async assertTotalMrrValueConfiguredStep(): Promise<void> {
    await expect(this.progressStepValue).toBeVisible();
    await this.form.expectActionTypeControlsHidden();
    await this.form.expectValueControlsVisible({ includeInput: true });
    await this.form.expectPointsControlsHidden();
    await this.assertBackEnabled();
    await expect(this.loadingIndicator).toBeHidden();
    await expect(this.errorBlock).toBeHidden();
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
    await expect(this.form.valueTypeTriggerValue).toContainText(value);
    await expect(this.form.valueInput).toBeVisible();
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
    await expect(this.progressStepPoints).toBeVisible();
    await this.form.expectPointsControlsVisible();
    await expect(this.loadingIndicator).toBeHidden();
    await expect(this.errorBlock).toBeHidden();
  }

  async assertTotalMrrPointsStep(): Promise<void> {
    await expect(this.progressStepPoints).toBeVisible();
    await this.form.expectActionTypeControlsHidden();
    await this.form.expectValueControlsHidden();
    await this.form.expectPointsControlsVisible();
    await this.assertBackEnabled();
    await expect(this.loadingIndicator).toBeHidden();
    await expect(this.errorBlock).toBeHidden();
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
