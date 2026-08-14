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

  nonEmpty(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'count>0', () =>
      expect.poll(() => locator.count(), options).toBeGreaterThan(0),
    );
  }

  countAtLeast(
    target: string,
    locator: Locator,
    minimum: number,
    options?: { timeout?: number },
  ): Promise<void> {
    return loggedExpectation(this.page, target, locator, `count>=${minimum}`, () =>
      expect.poll(() => locator.count(), options).toBeGreaterThanOrEqual(minimum),
    );
  }

  attribute(
    target: string,
    locator: Locator,
    name: string,
    value: string | RegExp,
    options?: { timeout?: number },
  ): Promise<void> {
    return loggedExpectation(this.page, target, locator, `${name}=${String(value)}`, () =>
      expect(locator).toHaveAttribute(name, value, options),
    );
  }

  value(target: string, locator: Locator, expected: string | RegExp): Promise<void> {
    return loggedExpectation(this.page, target, locator, `value=${String(expected)}`, () =>
      expect(locator).toHaveValue(expected),
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

  notContainsText(target: string, locator: Locator, value: string | RegExp): Promise<void> {
    return loggedExpectation(this.page, target, locator, `notContainsText=${String(value)}`, () =>
      expect(locator).not.toContainText(value),
    );
  }

  nonEmptyText(target: string, locator: Locator): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'text is not empty', () =>
      expect(locator).toHaveText(/\S/),
    );
  }

  url(target: string, value: string | RegExp, options?: { timeout?: number }): Promise<void> {
    const body = this.page.locator('body');
    return loggedExpectation(this.page, target, body, `url=${String(value)}`, () =>
      expect(this.page).toHaveURL(value, options),
    );
  }

  textChanged(
    target: string,
    locator: Locator,
    previousValue: string | null,
    options?: { timeout?: number; intervals?: number[] },
  ): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'text changed', () =>
      expect.poll(() => locator.textContent(), options).not.toBe(previousValue),
    );
  }

  pollNumberAtLeast(
    target: string,
    locator: Locator,
    probe: () => Promise<number>,
    minimum: number,
    options?: { timeout?: number; intervals?: number[] },
  ): Promise<void> {
    return loggedExpectation(this.page, target, locator, `poll>=${minimum}`, () =>
      expect.poll(probe, options).toBeGreaterThanOrEqual(minimum),
    );
  }

  screenshot(target: string, locator: Locator, name: string): Promise<void> {
    return loggedExpectation(this.page, target, locator, `screenshot=${name}`, () =>
      expect(locator).toHaveScreenshot(name, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.03,
      }),
    );
  }
}
