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

  disabled(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'disabled', () =>
      expect(locator).toBeDisabled(options),
    );
  }

  count(target: string, locator: Locator, value: number): Promise<void> {
    return loggedExpectation(this.page, target, locator, `count=${value}`, () =>
      expect(locator).toHaveCount(value),
    );
  }

  text(target: string, locator: Locator, value: string | RegExp): Promise<void> {
    return loggedExpectation(this.page, target, locator, `text=${String(value)}`, () =>
      expect(locator).toHaveText(value),
    );
  }

  containsText(target: string, locator: Locator, value: string | RegExp): Promise<void> {
    return loggedExpectation(this.page, target, locator, `containsText=${String(value)}`, () =>
      expect(locator).toContainText(value),
    );
  }

  url(target: string, value: string | RegExp, options?: { timeout?: number }): Promise<void> {
    const body = this.page.locator('body');
    return loggedExpectation(this.page, target, body, `url=${String(value)}`, () =>
      expect(this.page).toHaveURL(value, options),
    );
  }
}
