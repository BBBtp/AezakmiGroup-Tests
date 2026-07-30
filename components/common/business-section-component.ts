import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';

const technicalValue = /\b(?:error-content|undefined|NaN)\b|\[object Object\]/i;

export abstract class BusinessSectionComponent extends UiObject {
  abstract readonly root: Locator;

  protected constructor(
    page: Page,
    readonly name: string,
  ) {
    super(page);
  }

  async expectHealthy(): Promise<void> {
    await this.expectations.visible(`${this.name} section`, this.root);
    await this.expectations.notContainsText(
      `${this.name} section without technical values`,
      this.root,
      technicalValue,
    );
  }

  protected async expectControls(controls: ReadonlyArray<readonly [string, Locator]>): Promise<void> {
    for (const [name, locator] of controls) {
      await this.expectations.visible(`${this.name}: ${name}`, locator);
    }
  }
}
