import { expect, type Locator, type Page } from '@playwright/test';

import { loggedExpectation } from '@utils/playwright-logger';

export class UiExpectations {
  constructor(private readonly page: Page) {}

  visible(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'отображается', () =>
      expect(locator).toBeVisible(options),
    );
  }

  hidden(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'скрыт', () => expect(locator).toBeHidden(options));
  }

  enabled(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'доступен', () =>
      expect(locator).toBeEnabled(options),
    );
  }

  disabled(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'недоступен', () =>
      expect(locator).toBeDisabled(options),
    );
  }

  focused(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'находится в фокусе', () =>
      expect(locator).toBeFocused(options),
    );
  }

  count(target: string, locator: Locator, value: number): Promise<void> {
    return loggedExpectation(this.page, target, locator, `количество = ${value}`, () =>
      expect(locator).toHaveCount(value),
    );
  }

  nonEmpty(target: string, locator: Locator, options?: { timeout?: number }): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'содержит элементы', () =>
      expect.poll(() => locator.count(), options).toBeGreaterThan(0),
    );
  }

  countAtLeast(
    target: string,
    locator: Locator,
    minimum: number,
    options?: { timeout?: number },
  ): Promise<void> {
    return loggedExpectation(this.page, target, locator, `количество не меньше ${minimum}`, () =>
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
    return loggedExpectation(this.page, target, locator, `атрибут ${name} = ${String(value)}`, () =>
      expect(locator).toHaveAttribute(name, value, options),
    );
  }

  value(target: string, locator: Locator, expected: string | RegExp): Promise<void> {
    return loggedExpectation(this.page, target, locator, `значение = ${String(expected)}`, () =>
      expect(locator).toHaveValue(expected),
    );
  }

  text(target: string, locator: Locator, value: string | RegExp): Promise<void> {
    return loggedExpectation(this.page, target, locator, `текст = ${String(value)}`, () =>
      expect(locator).toHaveText(value),
    );
  }

  containsText(target: string, locator: Locator, value: string | RegExp): Promise<void> {
    return loggedExpectation(this.page, target, locator, `содержит текст ${String(value)}`, () =>
      expect(locator).toContainText(value),
    );
  }

  notContainsText(target: string, locator: Locator, value: string | RegExp): Promise<void> {
    return loggedExpectation(this.page, target, locator, `не содержит текст ${String(value)}`, () =>
      expect(locator).not.toContainText(value),
    );
  }

  nonEmptyText(target: string, locator: Locator): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'текст не пуст', () =>
      expect(locator).toHaveText(/\S/),
    );
  }

  widthAtMost(target: string, locator: Locator, maximum: number): Promise<void> {
    return loggedExpectation(this.page, target, locator, `ширина не больше ${maximum}px`, () =>
      expect
        .poll(async () => (await locator.boundingBox())?.width ?? Number.POSITIVE_INFINITY)
        .toBeLessThanOrEqual(maximum),
    );
  }

  url(target: string, value: string | RegExp, options?: { timeout?: number }): Promise<void> {
    const body = this.page.locator('body');
    return loggedExpectation(this.page, target, body, `URL соответствует ${String(value)}`, () =>
      expect(this.page).toHaveURL(value, options),
    );
  }

  textChanged(
    target: string,
    locator: Locator,
    previousValue: string | null,
    options?: { timeout?: number; intervals?: number[] },
  ): Promise<void> {
    return loggedExpectation(this.page, target, locator, 'текст изменился', () =>
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
    return loggedExpectation(this.page, target, locator, `значение не меньше ${minimum}`, () =>
      expect.poll(probe, options).toBeGreaterThanOrEqual(minimum),
    );
  }

  pollNumber(
    target: string,
    locator: Locator,
    probe: () => Promise<number>,
    expected: number,
    options?: { timeout?: number; intervals?: number[] },
  ): Promise<void> {
    return loggedExpectation(this.page, target, locator, `значение равно ${expected}`, () =>
      expect.poll(probe, options).toBe(expected),
    );
  }

  screenshot(target: string, locator: Locator, name: string): Promise<void> {
    return loggedExpectation(this.page, target, locator, `снимок соответствует ${name}`, () =>
      expect(locator).toHaveScreenshot(name, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.03,
      }),
    );
  }
}
