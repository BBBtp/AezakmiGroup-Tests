import { Page, Locator } from '@playwright/test';
import { loggedAction, loggedExpectation } from '../utils/playwright-logger';

export class BasePage {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }
  async navigateTo(url: string): Promise<void> {
    const timeout = process.env.CI ? 60000 : 30000;
    await loggedAction(this.page, 'navigate', `navigation to ${url}`, this.page.locator('body'), () =>
      this.page.goto(url, {
        waitUntil: 'commit',
        timeout,
      }),
    );
  }
  async getTitle(): Promise<string> {
    return await this.page.title();
  }
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }
  async waitForElement(selector: string): Promise<Locator> {
    const element = this.page.locator(selector);
    await loggedExpectation(this.page, `element ${selector}`, element, 'visible', () =>
      element.waitFor({ state: 'visible' }),
    );
    return element;
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async waitForUrl(url: string | RegExp): Promise<void> {
    await this.page.waitForURL(url);
  }
}
