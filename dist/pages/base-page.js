"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePage = void 0;
class BasePage {
    page;
    constructor(page) {
        this.page = page;
    }
    async navigateTo(url) {
        await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });
    }
    async getTitle() {
        return await this.page.title();
    }
    async waitForLoad() {
        await this.page.waitForLoadState('domcontentloaded');
    }
    async waitForElement(selector) {
        const element = this.page.locator(selector);
        await element.waitFor({ state: 'visible' });
        return element;
    }
    async takeScreenshot(name) {
        await this.page.screenshot({ path: `screenshots/${name}.png` });
    }
    async getCurrentUrl() {
        return this.page.url();
    }
    async waitForUrl(url) {
        await this.page.waitForURL(url);
    }
}
exports.BasePage = BasePage;
