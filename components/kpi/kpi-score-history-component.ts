import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { kpiManagerText, kpiTestIds } from '@locators/kpi';

export class KpiScoreHistoryComponent extends UiObject {
  readonly addPointsButton: Locator;
  readonly dialog: Locator;
  readonly actionTypeSelect: Locator;
  readonly otherAction: Locator;
  readonly addedPoints: Locator;
  readonly subtractedPoints: Locator;
  readonly pointsInput: Locator;
  readonly commentInput: Locator;
  readonly zeroValidation: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addPointsButton = this.locate
      .css(kpiTestIds.scoreHistory.pageButtonSelector)
      .filter({ hasText: kpiManagerText.addPoints })
      .first();
    this.dialog = this.locate.role('dialog', {
      name: kpiManagerText.addPointsDialog,
    });
    const dialog = this.locate.within(this.dialog);
    this.actionTypeSelect = dialog
      .role('combobox')
      .or(dialog.role('button', { name: new RegExp(kpiManagerText.actionType, 'i') }));
    this.otherAction = this.locate.testId(kpiTestIds.scoreHistory.otherActionOption);
    this.addedPoints = dialog.role('radio', {
      name: kpiManagerText.addedPoints,
      exact: true,
    });
    this.subtractedPoints = dialog.role('radio', {
      name: kpiManagerText.subtractedPoints,
      exact: true,
    });
    this.pointsInput = dialog
      .role('textbox', { name: kpiManagerText.pointsInput })
      .or(dialog.css(`[placeholder="${kpiManagerText.pointsInputPlaceholder}"]`));
    this.commentInput = dialog.css(`[placeholder="${kpiManagerText.commentPlaceholder}"]`);
    this.zeroValidation = dialog.text(kpiManagerText.zeroValidation, { exact: true });
    this.submitButton = dialog.role('button', {
      name: kpiManagerText.submitPoints,
      exact: true,
    });
  }

  async expand(): Promise<void> {
    await this.expectExpanded();
  }

  async openAddPoints(): Promise<void> {
    await this.actions.click('история изменения баллов: открыть добавление баллов', this.addPointsButton);
    await this.expectations.visible('модальное окно добавления баллов', this.dialog);
  }

  async selectSubtracted(): Promise<void> {
    await this.actions.check('тип баллов «вычтены»', this.subtractedPoints);
    await this.expectations.attribute('тип баллов «вычтены»', this.subtractedPoints, 'aria-checked', 'true');
  }

  async selectAdded(): Promise<void> {
    await this.actions.check('тип баллов «добавлены»', this.addedPoints);
    await this.expectations.attribute('тип баллов «добавлены»', this.addedPoints, 'aria-checked', 'true');
  }

  async selectOtherAction(): Promise<void> {
    await this.actions.click('тип действия с баллами', this.actionTypeSelect);
    await this.actions.click('тип действия «Other»', this.otherAction);
  }

  async fillPoints(value: string): Promise<void> {
    await this.actions.fill('количество баллов', this.pointsInput, value);
  }

  async fillComment(value: string): Promise<void> {
    await this.actions.fill('комментарий к изменению баллов', this.commentInput, value);
  }

  async expectExpanded(): Promise<void> {
    await this.expectations.visible('кнопка добавления баллов в раскрытой истории', this.addPointsButton);
  }

  async expectDialogOpen(): Promise<void> {
    await this.expectations.visible('модальное окно добавления баллов', this.dialog);
  }

  async expectValidPoints(value: string): Promise<void> {
    await this.expectations.value('поле количества баллов', this.pointsInput, value);
    await this.expectations.hidden('ошибка нулевого количества баллов', this.zeroValidation);
    await this.expectations.enabled('кнопка подтверждения добавления баллов', this.submitButton);
  }
}
