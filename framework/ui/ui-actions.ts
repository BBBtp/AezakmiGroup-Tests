import type { Locator, Page } from '@playwright/test';

import { loggedAction, loggedClick, loggedFill, loggedSelectOption } from '@utils/playwright-logger';

export class UiActions {
  constructor(private readonly page: Page) {}

  click(target: string, locator: Locator, options?: Parameters<Locator['click']>[0]): Promise<void> {
    return loggedClick(this.page, target, locator, options);
  }

  fill(target: string, locator: Locator, value: string): Promise<void> {
    return loggedFill(this.page, target, locator, value);
  }

  select(
    target: string,
    locator: Locator,
    options: Parameters<Locator['selectOption']>[0],
  ): Promise<string[]> {
    return loggedSelectOption(this.page, target, locator, options);
  }

  check(target: string, locator: Locator): Promise<void> {
    return loggedAction(this.page, 'check', target, locator, () => locator.check());
  }

  press(target: string, locator: Locator, key: string): Promise<void> {
    return loggedAction(this.page, 'press', target, locator, () => locator.press(key));
  }

  run<T>(
    action: Parameters<typeof loggedAction<T>>[1],
    target: string,
    locator: Locator,
    operation: () => Promise<T>,
  ): Promise<T> {
    return loggedAction(this.page, action, target, locator, operation);
  }

  navigate(target: string, url: string, options?: Parameters<Page['goto']>[1]) {
    return loggedAction(this.page, 'navigate', target, this.page.locator('body'), () =>
      this.page.goto(url, options),
    );
  }

  goBack(target = 'browser history: back') {
    return loggedAction(this.page, 'navigate', target, this.page.locator('body'), () => this.page.goBack());
  }
}
