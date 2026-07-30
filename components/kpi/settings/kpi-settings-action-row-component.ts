import { type Locator, type Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiSettingsTestIds } from '@locators/kpi-settings';

export class KpiSettingsActionRowComponent extends UiObject {
  readonly tableName: string;
  readonly actionType: string;
  readonly value: string;
  readonly root: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly actionButtons: Locator;
  readonly toast: Locator;
  readonly toastTitle: Locator;
  readonly toastSubtitle: Locator;
  readonly editModal: Locator;
  readonly editForm: Locator;
  readonly deleteModal: Locator;
  readonly pointsRadioGroup: Locator;
  readonly pointsRadioPlus: Locator;
  readonly pointsRadioMinus: Locator;
  readonly pointsInput: Locator;
  readonly pointsInputSign: Locator;
  readonly saveButton: Locator;
  readonly errorBlock: Locator;
  constructor(page: Page, tableName: string, actionType: string, value: string) {
    super(page);
    this.tableName = tableName;
    this.actionType = actionType;
    this.value = value;
    const testIds = kpiSettingsTestIds.row(tableName, actionType, value);
    const alternateValue = this.createAlternateValue();
    const alternateTestIds = alternateValue
      ? kpiSettingsTestIds.row(tableName, actionType, alternateValue)
      : undefined;
    this.root = this.locatorByTestIds(testIds.root, alternateTestIds?.root);
    this.editButton = this.locatorByTestIds(testIds.editButton, alternateTestIds?.editButton);
    this.deleteButton = this.locatorByTestIds(testIds.deleteButton, alternateTestIds?.deleteButton);
    this.actionButtons = this.locatorByTestIds(testIds.actionButtons, alternateTestIds?.actionButtons);
    this.toast = this.locatorByTestIds(testIds.toast, alternateTestIds?.toast);
    this.toastTitle = this.locatorByTestIds(testIds.toastTitle, alternateTestIds?.toastTitle);
    this.toastSubtitle = this.locatorByTestIds(testIds.toastSubtitle, alternateTestIds?.toastSubtitle);
    this.editModal = this.locatorByTestIds(testIds.editModal, alternateTestIds?.editModal);
    this.editForm = this.locatorByTestIds(testIds.editForm, alternateTestIds?.editForm);
    this.deleteModal = this.locatorByTestIds(testIds.deleteModal, alternateTestIds?.deleteModal);
    this.pointsRadioGroup = this.locatorByTestIds(testIds.pointsRadio, alternateTestIds?.pointsRadio);
    this.pointsRadioPlus = this.locatorByTestIds(testIds.pointsRadioPlus, alternateTestIds?.pointsRadioPlus);
    this.pointsRadioMinus = this.locatorByTestIds(
      testIds.pointsRadioMinus,
      alternateTestIds?.pointsRadioMinus,
    );
    this.pointsInput = this.locatorByTestIds(testIds.pointsInput, alternateTestIds?.pointsInput);
    this.pointsInputSign = this.locatorByTestIds(testIds.pointsInputSign, alternateTestIds?.pointsInputSign);
    this.saveButton = this.locatorByTestIds(testIds.saveButton, alternateTestIds?.saveButton);
    this.errorBlock = this.locatorByTestIds(testIds.error, alternateTestIds?.error);
  }

  private createAlternateValue(): string | undefined {
    const reachedValue = this.value.match(/^Reached \$(\d+)$/)?.[1];

    if (this.tableName !== 'total-mrr' || !reachedValue) {
      return undefined;
    }

    return `Reached $ ${reachedValue}`;
  }

  private locatorByTestIds(primaryTestId: string, alternateTestId?: string): Locator {
    const primary = this.locate.testId(primaryTestId);

    if (!alternateTestId) {
      return primary;
    }

    return primary.or(this.locate.testId(alternateTestId)).first();
  }

  async expectVisible(): Promise<void> {
    await this.expectations.visible('KPI settings action row', this.root);
    await this.expectations.visible('KPI settings edit action', this.editButton);
    await this.expectations.visible('KPI settings delete action', this.deleteButton);
  }

  async expectEditable(): Promise<void> {
    await this.expectations.visible('KPI settings edit action', this.editButton);
    await this.expectations.enabled('KPI settings delete action', this.deleteButton);
  }

  async openEditModal(): Promise<void> {
    await this.expectations.enabled('KPI settings edit action', this.editButton);
    await this.actions.click(`KPI settings: edit ${this.actionType}/${this.value}`, this.editButton);
    await this.expectEditModalVisible();
  }

  async expectEditModalVisible(): Promise<void> {
    await this.expectations.visible('KPI settings edit modal', this.editModal);
    await this.expectations.visible('KPI settings edit form', this.editForm);
    await this.expectations.visible('KPI settings points radio group', this.pointsRadioGroup);
    await this.expectations.visible('KPI settings plus points', this.pointsRadioPlus);
    await this.expectations.visible('KPI settings minus points', this.pointsRadioMinus);
    await this.expectations.visible('KPI settings points input', this.pointsInput);
    await this.expectations.visible('KPI settings save action', this.saveButton);
  }

  async selectEditPointsType(type: 'plus' | 'minus'): Promise<void> {
    const option = type === 'plus' ? this.pointsRadioPlus : this.pointsRadioMinus;
    await this.actions.click(`KPI settings: select ${type} points`, option);
  }

  async fillEditPoints(value: string): Promise<void> {
    await this.actions.fill(
      `KPI settings: fill points ${this.actionType}/${this.value}`,
      this.pointsInput,
      value,
    );
    await this.expectations.enabled('KPI settings save action', this.saveButton);
  }

  async saveEdit(): Promise<void> {
    await this.expectations.enabled('KPI settings save action', this.saveButton);
    await this.actions.click(`KPI settings: save ${this.actionType}/${this.value}`, this.saveButton);
  }

  async expectEditModalHidden(): Promise<void> {
    await this.expectations.hidden('KPI settings edit modal', this.editModal);
  }

  async expectEditErrorVisible(): Promise<void> {
    await this.expectations.visible('KPI settings edit error', this.errorBlock);
  }

  async openDeleteModal(): Promise<void> {
    await this.expectations.enabled('KPI settings delete action', this.deleteButton);
    await this.actions.click(`KPI settings: open delete ${this.actionType}/${this.value}`, this.deleteButton);
    await this.expectations.visible('KPI settings delete modal', this.deleteModal);
  }

  async confirmDelete(): Promise<void> {
    const confirmButton = this.locate.testId(kpiSettingsTestIds.deleteConfirm);
    await this.actions.click('KPI settings: confirm delete', confirmButton);
  }

  async cancelDelete(): Promise<void> {
    const cancelButton = this.locate.testId(kpiSettingsTestIds.deleteCancel);
    await this.actions.click('KPI settings: cancel delete', cancelButton);
    await this.expectations.hidden('KPI settings delete modal', this.deleteModal);
  }

  async expectDeleted(): Promise<void> {
    await this.expectations.count('KPI settings deleted row action', this.deleteButton, 0);
  }
}
