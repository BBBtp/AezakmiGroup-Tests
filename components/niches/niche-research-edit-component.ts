import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { nicheResearchTestIds } from '@locators/niche-research';

const ids = nicheResearchTestIds.edit;

export class NicheResearchEditComponent extends UiObject {
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

  async expectInitial(name: string, description: string): Promise<void> {
    await this.expectations.visible('Форма редактирования исследуемой ниши', this.root);
    await this.expectations.value('Название редактируемой исследуемой ниши', this.nameInput, name);
    await this.expectations.value(
      'Описание редактируемой исследуемой ниши',
      this.descriptionInput,
      description,
    );
  }

  async changeName(name: string): Promise<void> {
    await this.actions.fill('Новое название исследуемой ниши', this.nameInput, name);
  }

  async changeDescription(description: string): Promise<void> {
    await this.actions.fill('Новое описание исследуемой ниши', this.descriptionInput, description);
  }

  async expectOpen(): Promise<void> {
    await this.expectations.visible('Форма редактирования исследуемой ниши', this.root);
  }

  async expectValues(name: string, description: string): Promise<void> {
    await this.expectations.value('Название редактируемой исследуемой ниши', this.nameInput, name);
    await this.expectations.value(
      'Описание редактируемой исследуемой ниши',
      this.descriptionInput,
      description,
    );
  }

  async expectScreenshot(name: string): Promise<void> {
    await this.expectations.screenshot('Визуальное состояние формы редактирования ниши', this.root, name);
  }

  async submit(): Promise<void> {
    await this.actions.click('Сохранение исследуемой ниши', this.submitButton);
  }

  async close(): Promise<void> {
    await this.actions.click('Закрытие формы редактирования исследуемой ниши', this.closeButton);
    await this.expectClosed();
  }

  async expectClosed(): Promise<void> {
    await this.expectations.hidden('Форма редактирования исследуемой ниши', this.root);
  }
}
