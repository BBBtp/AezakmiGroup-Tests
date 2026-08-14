import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import {
  readOnlySectionLocators,
  type ReadOnlySection,
  type ReadOnlySectionControl,
} from '@locators/read-only-sections';

export class ReadOnlySectionComponent extends UiObject {
  readonly root: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role(readOnlySectionLocators.pageRole);
  }

  async expectHealthy(section: ReadOnlySection): Promise<void> {
    const contract = readOnlySectionLocators.sections[section];
    await this.expectations.visible(`${contract.label} page`, this.root);
    await this.expectations.notContainsText(
      `${contract.label} without technical values`,
      this.root,
      readOnlySectionLocators.technicalValue,
    );

    for (const control of contract.controls) {
      await this.expectations.visible(`${contract.label}: ${String(control.name)}`, this.control(control));
    }

    if ('collection' in contract) {
      await this.expectations.nonEmpty(`${contract.label}: business rows`, this.control(contract.collection));
    }
  }

  private control(control: ReadOnlySectionControl): Locator {
    return this.locate
      .within(this.root)
      .role(control.role, { name: control.name, exact: typeof control.name === 'string' });
  }
}
