import type { Page } from '@playwright/test';
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

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForUrl(url: string | RegExp): Promise<void> {
    await this.page.waitForURL(url);
  }
}
