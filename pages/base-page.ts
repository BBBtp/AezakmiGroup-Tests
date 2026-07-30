import type { Locator, Page } from '@playwright/test';
import { UiObject } from '@framework/ui';

export class BasePage extends UiObject {
  constructor(page: Page) {
    super(page);
  }

  async navigateTo(url: string): Promise<void> {
    const timeout = process.env.CI ? 60000 : 30000;
    await this.actions.navigate(`navigation to ${url}`, url, {
      waitUntil: 'commit',
      timeout,
    });
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForElement(selector: string): Promise<Locator> {
    const element = this.locate.css(selector);
    await this.expectations.visible(`element ${selector}`, element);
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
