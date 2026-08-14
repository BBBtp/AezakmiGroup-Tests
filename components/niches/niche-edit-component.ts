import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';

export class NicheEditComponent extends UiObject {
  readonly dialog: Locator;
  readonly nameInput: Locator;
  readonly moduleSelect: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = this.locate.role('dialog', { name: 'Editing niche' });
    this.nameInput = this.locate.within(this.dialog).role('textbox', { name: 'Niche name' });
    this.moduleSelect = this.locate.within(this.dialog).role('combobox').first();
    this.submitButton = this.locate.within(this.dialog).role('button', { name: 'Save', exact: true });
  }

  async expectInitial(name: string, module: 'ASO' | 'Web View'): Promise<void> {
    await this.expectations.visible('Edit niche: dialog', this.dialog);
    await this.expectations.value('Edit niche: name', this.nameInput, name);
    await this.expectations.containsText('Edit niche: module', this.moduleSelect, module);
    await this.expectations.disabled('Edit niche: unchanged form', this.submitButton);
  }

  async fillName(value: string): Promise<void> {
    await this.actions.fill('Edit niche: name', this.nameInput, value);
  }

  async selectModule(module: 'ASO' | 'Web View'): Promise<void> {
    await this.actions.click('Edit niche: open Module', this.moduleSelect);
    await this.actions.click(
      `Edit niche: select ${module}`,
      this.locate.role('option', { name: module, exact: true }),
    );
    await this.expectations.containsText(`Edit niche: selected ${module}`, this.moduleSelect, module);
  }

  async expectSubmitEnabled(): Promise<void> {
    await this.expectations.enabled('Edit niche: Save enabled', this.submitButton);
  }

  async submit(): Promise<void> {
    await this.actions.click('Edit niche: Save', this.submitButton);
  }
}
