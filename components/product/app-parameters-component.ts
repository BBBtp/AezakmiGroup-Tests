import type { Locator, Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { productLocators } from '@locators/product';

export class AppParametersComponent extends UiObject {
  readonly dialog: Locator;
  readonly staffTitle: Locator;
  readonly staffCard: Locator;
  readonly staffSelectValues: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = this.locate.role('dialog');
    const withinDialog = this.locate.within(this.dialog);
    this.staffTitle = withinDialog.role('heading', {
      name: productLocators.apps.detail.staff,
      exact: true,
    });
    this.staffCard = this.locate.within(this.staffTitle).css(productLocators.apps.detail.staffCard);
    this.staffSelectValues = this.locate.within(this.staffCard).css(productLocators.apps.detail.selectValue);
  }

  async open(): Promise<void> {
    const main = this.locate.role('main');
    const withinMain = this.locate.within(main);
    await this.expectations.visible('заголовок приложения', withinMain.role('heading', { level: 2 }).first());

    // The product menu trigger currently has neither an accessible name nor a test id.
    const title = withinMain.role('heading', { level: 2 }).first();
    const header = this.locate.within(title).css(productLocators.apps.detail.appHeader);
    const menuButton = this.locate.within(header).role('button').first();
    await this.actions.click('страница приложения: открыть меню действий', menuButton);
    await this.actions.click(
      'страница приложения: открыть редактирование параметров',
      this.locate.text(productLocators.apps.detail.editParameters, { exact: true }),
    );
    await this.expectations.visible('диалог редактирования параметров приложения', this.dialog);
    await this.expectations.visible('карточка Staff в параметрах приложения', this.staffTitle);
  }

  async expectStaffSelectValuesWithoutLeadingGap(): Promise<void> {
    const withinStaff = this.locate.within(this.staffCard);
    await this.expectations.visible('карточка Staff', this.staffTitle);
    await this.expectations.visible(
      'заголовок колонки Parameter в Staff',
      withinStaff.text(productLocators.apps.detail.parameter, { exact: true }),
    );
    await this.expectations.visible(
      'заголовок колонки Value в Staff',
      withinStaff.text(productLocators.apps.detail.value, { exact: true }),
    );
    await this.expectations.visible(
      'заголовок колонки Contacts в Staff',
      withinStaff.text(productLocators.apps.detail.contacts, { exact: true }),
    );
    await this.expectations.countAtLeast('выбранные значения Staff Select', this.staffSelectValues, 1);

    const valuesCount = await this.staffSelectValues.count();
    for (let index = 0; index < valuesCount; index += 1) {
      await this.expectations.text(
        `значение Staff Select ${index + 1} без начального пробела`,
        this.staffSelectValues.nth(index),
        /^\S.*$/,
      );
    }
  }
}
