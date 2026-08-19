import type { Locator, Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { administrationLocators } from '@locators/administration';

export class AdministrationComponent extends UiObject {
  readonly root: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
  }

  async expectParameters(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible(
      'Parameters: title',
      within.role('heading', { name: administrationLocators.parameters.title, exact: true }),
    );
    await this.expectations.visible(
      'Parameters: description',
      within.text(administrationLocators.parameters.description, { exact: true }),
    );
    for (const group of administrationLocators.parameters.parameterGroups) {
      await this.expectations.visible(`Parameters: ${group}`, within.text(group, { exact: true }).first());
    }
    await this.expectations.nonEmpty(
      'Parameters: Edit actions',
      within.role('button', { name: administrationLocators.parameters.edit, exact: true }),
    );
    await this.expectations.notContainsText(
      'Parameters: no technical values',
      this.root,
      administrationLocators.technicalValue,
    );
  }

  async openFirstEdit(): Promise<void> {
    await this.actions.click(
      'Parameters: edit first value',
      this.locate
        .within(this.root)
        .role('button', { name: administrationLocators.parameters.edit, exact: true })
        .first(),
    );
    await this.expectations.visible('Parameters: edit dialog', this.locate.role('dialog'));
  }

  async openFirstDelete(): Promise<void> {
    await this.actions.click(
      'Parameters: delete first removable value',
      this.locate
        .within(this.root)
        .role('button', { name: administrationLocators.parameters.delete, exact: true })
        .first(),
    );
    await this.expectations.visible('Parameters: delete dialog', this.locate.role('dialog'));
  }

  async openAddValue(): Promise<void> {
    await this.actions.click(
      'Parameters: add value',
      this.locate.within(this.root).role('button', { name: administrationLocators.parameters.add }).first(),
    );
    await this.expectations.visible('Parameters: add value dialog', this.locate.role('dialog'));
  }

  async cancelDialog(): Promise<void> {
    const dialog = this.locate.role('dialog');
    const cancel = this.locate
      .within(dialog)
      .role('button', { name: /Cancel|Close|No/i })
      .first();
    if ((await cancel.count()) > 0) await this.actions.click('Parameters: cancel dialog', cancel);
    else await this.actions.press('Parameters: close dialog', dialog, 'Escape');
    await this.expectations.hidden('Parameters: dialog closed', dialog);
  }

  async expectEmployees(): Promise<void> {
    const within = this.locate.within(this.root);
    for (const label of [
      administrationLocators.employees.archive,
      administrationLocators.employees.settings,
      administrationLocators.employees.create,
      administrationLocators.employees.filters,
    ]) {
      await this.expectations.visible(
        `Employees: ${label}`,
        within.role('button', { name: label, exact: true }),
      );
    }
    await this.expectations.nonEmpty(
      'Employees: rows',
      within.role('link', { name: administrationLocators.employees.more, exact: true }),
    );
    await this.expectations.notContainsText(
      'Employees: no technical values',
      this.root,
      administrationLocators.technicalValue,
    );
  }

  async openFirstEmployee(): Promise<void> {
    await this.actions.click(
      'Employees: open first employee',
      this.locate
        .within(this.root)
        .role('link', { name: administrationLocators.employees.more, exact: true })
        .first(),
    );
    await this.expectations.visible('Employee detail: main', this.root);
  }
}
