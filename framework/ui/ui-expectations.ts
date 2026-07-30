import { expect, type Locator, type Page } from '@playwright/test';

import { loggedExpectation } from '@utils/playwright-logger';

export class UiExpectations {
  constructor(private readonly page: Page) {}

  visible(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'visible', () =>
      expect(locator).toBeVisible(options),
    );
  }

  hidden(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'hidden', () => expect(locator).toBeHidden(options));
  }

  enabled(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'enabled', () =>
      expect(locator).toBeEnabled(options),
    );
  }

  text(target: string, locator: Locator, value: string | RegExp): Promise<void> {
    return loggedExpectation(this.page, target, locator, `text=${String(value)}`, () =>
      expect(locator).toHaveText(value),
    );
  }
}
