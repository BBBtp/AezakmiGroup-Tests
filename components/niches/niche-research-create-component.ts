import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { nicheResearchTestIds } from '@locators/niche-research';

const ids = nicheResearchTestIds.create;

export class NicheResearchCreateComponent extends UiObject {
  readonly root: Locator;
  readonly title: Locator;
  readonly closeButton: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly categoryCheckbox: Locator;
  readonly managerTrigger: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(ids.root);
    this.title = this.locate.testId(ids.title);
    this.closeButton = this.locate.testId(ids.close);
    this.nameInput = this.locate.testId(ids.name);
    this.descriptionInput = this.locate.testId(ids.description);
    this.categoryCheckbox = this.locate.testId(ids.category);
    this.managerTrigger = this.locate.testId(ids.managerTrigger);
    this.submitButton = this.locate.testId(ids.submit);
  }

  async expectInitial(): Promise<void> {
    await this.expectations.visible('Форма создания исследуемой ниши', this.title);
    await this.expectations.value('Название новой исследуемой ниши', this.nameInput, '');
    await this.expectations.value('Описание новой исследуемой ниши', this.descriptionInput, '');
    await this.expectations.containsText(
      'Выбор ASO-менеджера новой исследуемой ниши',
      this.managerTrigger,
      'Select a ASO manager',
    );
    await this.expectations.disabled('Кнопка создания исследуемой ниши', this.submitButton);
  }

  async fillRequiredFields(name: string, description: string): Promise<void> {
    await this.actions.fill('Название новой исследуемой ниши', this.nameInput, name);
    await this.actions.fill('Описание новой исследуемой ниши', this.descriptionInput, description);
  }

  async toggleNeuroCategory(): Promise<void> {
    await this.actions.click('Категория Neuro niche', this.categoryCheckbox);
  }

  async selectFirstManager(): Promise<string> {
    await this.actions.click('Открытие списка ASO manager новой ниши', this.managerTrigger);
    const option = this.locate.testId(ids.managerOption).first();
    const name = (await option.textContent())?.trim() ?? '';
    await this.actions.click(`Выбор ASO manager ${name}`, option);
    await this.expectations.containsText('Выбранный ASO manager новой ниши', this.managerTrigger, name);
    return name;
  }

  async expectManagerReset(): Promise<void> {
    await this.expectations.containsText(
      'Сброшенный ASO manager новой ниши',
      this.managerTrigger,
      'Select a ASO manager',
    );
  }

  async expectSubmitEnabled(): Promise<void> {
    await this.expectations.enabled('Кнопка создания исследуемой ниши', this.submitButton);
  }

  async expectSubmitDisabled(): Promise<void> {
    await this.expectations.disabled('Кнопка создания исследуемой ниши', this.submitButton);
  }

  async expectValues(name: string, description: string): Promise<void> {
    await this.expectations.value('Название новой исследуемой ниши', this.nameInput, name);
    await this.expectations.value('Описание новой исследуемой ниши', this.descriptionInput, description);
  }

  async expectNameLimit(limit: number): Promise<void> {
    await this.expectations.attribute(
      'Ограничение длины названия новой исследуемой ниши',
      this.nameInput,
      'maxlength',
      String(limit),
    );
  }

  async expectOpen(): Promise<void> {
    await this.expectations.visible('Форма создания исследуемой ниши', this.root);
  }

  async expectScreenshot(name: string): Promise<void> {
    await this.expectations.screenshot('Визуальное состояние формы создания ниши', this.root, name);
  }

  async submit(): Promise<void> {
    await this.actions.click('Создание исследуемой ниши', this.submitButton);
  }

  async expectClosed(): Promise<void> {
    await this.expectations.hidden('Форма создания исследуемой ниши', this.root);
  }

  async close(): Promise<void> {
    await this.actions.click('Закрытие формы создания исследуемой ниши', this.closeButton);
    await this.expectations.hidden('Форма создания исследуемой ниши', this.title);
  }
}
