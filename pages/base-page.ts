import { Page, Locator } from '@playwright/test';

export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigateTo(url: string): Promise<void> {
        await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });
    }

    async getTitle(): Promise<string> {
        return await this.page.title();
    }

    async waitForLoad(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
    }

    async waitForElement(selector: string): Promise<Locator> {
        const element = this.page.locator(selector);
        await element.waitFor({ state: 'visible' });
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