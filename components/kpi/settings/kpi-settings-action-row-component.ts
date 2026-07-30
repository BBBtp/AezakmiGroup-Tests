import { Locator, Page, expect } from '@playwright/test';
import { composeTestId, requireTestId } from '../../../utils/test-id';
import { loggedClick, loggedFill } from '../../../utils/playwright-logger';

export class KpiSettingsActionRowComponent {
  readonly page: Page;
  readonly tableName: string;
  readonly actionType: string;
  readonly value: string;
  readonly baseTestId: string;
  readonly alternateBaseTestId?: string;
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
    this.page = page;
    this.tableName = tableName;
    this.actionType = actionType;
    this.value = value;
    this.baseTestId = requireTestId(
      composeTestId([tableName, actionType, value]),
      'KpiSettingsActionRowComponent',
    );
    this.alternateBaseTestId = this.createAlternateBaseTestId();
    this.root = this.locatorByTestId();
    this.editButton = this.locatorByTestId('__edit');
    this.deleteButton = this.locatorByTestId('__delete');
    this.actionButtons = this.locatorByTestId('__action-buttons');
    this.toast = this.locatorByTestId('__alert');
    this.toastTitle = this.locatorByTestId('__alert-title');
    this.toastSubtitle = this.locatorByTestId('__alert-subtitle');
    this.editModal = this.locatorByTestId('__edit-modal');
    this.editForm = this.locatorByTestId('__edit-form');
    this.deleteModal = this.locatorByTestId('__delete-modal');
    this.pointsRadioGroup = this.locatorByTestId('__points-radio');
    this.pointsRadioPlus = this.locatorByTestId('__points-radio__plus');
    this.pointsRadioMinus = this.locatorByTestId('__points-radio__minus');
    this.pointsInput = this.locatorByTestId('__points-input');
    this.pointsInputSign = this.locatorByTestId('__points-input-sign');
    this.saveButton = this.locatorByTestId('__save');
    this.errorBlock = this.locatorByTestId('__error');
  }

  private createAlternateBaseTestId(): string | undefined {
    const reachedValue = this.value.match(/^Reached \$(\d+)$/)?.[1];

    if (this.tableName !== 'total-mrr' || !reachedValue) {
      return undefined;
    }

    return requireTestId(
      composeTestId([this.tableName, this.actionType, `Reached $ ${reachedValue}`]),
      'KpiSettingsActionRowComponent',
    );
  }

  private locatorByTestId(suffix = ''): Locator {
    const primary = this.page.locator(`[data-testid="${this.baseTestId}${suffix}"]`);

    if (!this.alternateBaseTestId) {
      return primary;
    }

    return primary.or(this.page.locator(`[data-testid="${this.alternateBaseTestId}${suffix}"]`)).first();
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.editButton).toBeVisible();
    await expect(this.deleteButton).toBeVisible();
  }

  async expectEditable(): Promise<void> {
    await expect(this.editButton).toBeVisible();
    await expect(this.deleteButton).toBeEnabled();
  }

  async openEditModal(): Promise<void> {
    await expect(this.editButton).toBeEnabled();
    await loggedClick(this.page, `KPI settings: edit ${this.actionType}/${this.value}`, this.editButton);
    await this.expectEditModalVisible();
  }

  async expectEditModalVisible(): Promise<void> {
    await expect(this.editModal).toBeVisible();
    await expect(this.editForm).toBeVisible();
    await expect(this.pointsRadioGroup).toBeVisible();
    await expect(this.pointsRadioPlus).toBeVisible();
    await expect(this.pointsRadioMinus).toBeVisible();
    await expect(this.pointsInput).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  async selectEditPointsType(type: 'plus' | 'minus'): Promise<void> {
    const option = type === 'plus' ? this.pointsRadioPlus : this.pointsRadioMinus;
    await loggedClick(this.page, `KPI settings: select ${type} points`, option);
  }

  async fillEditPoints(value: string): Promise<void> {
    await loggedFill(
      this.page,
      `KPI settings: fill points ${this.actionType}/${this.value}`,
      this.pointsInput,
      value,
    );
    await expect(this.saveButton).toBeEnabled();
  }

  async saveEdit(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
    await loggedClick(this.page, `KPI settings: save ${this.actionType}/${this.value}`, this.saveButton);
  }

  async expectEditModalHidden(): Promise<void> {
    await expect(this.editModal).toBeHidden();
  }

  async openDeleteModal(): Promise<void> {
    await expect(this.deleteButton).toBeEnabled();
    await loggedClick(
      this.page,
      `KPI settings: open delete ${this.actionType}/${this.value}`,
      this.deleteButton,
    );
    await expect(this.deleteModal).toBeVisible();
  }

  async confirmDelete(): Promise<void> {
    const confirmButton = this.page.locator('[data-testid="delete-item__del-btn"]');
    await loggedClick(this.page, 'KPI settings: confirm delete', confirmButton);
  }

  async cancelDelete(): Promise<void> {
    const cancelButton = this.page.locator('[data-testid="delete-item__cancel-btn"]');
    await loggedClick(this.page, 'KPI settings: cancel delete', cancelButton);
    await expect(this.deleteModal).toBeHidden();
  }

  async expectDeleted(): Promise<void> {
    await expect(this.deleteButton).toHaveCount(0);
  }
}
