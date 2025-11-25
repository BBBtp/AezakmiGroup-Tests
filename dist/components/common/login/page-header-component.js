"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageHeaderComponent = void 0;
const test_1 = require("@playwright/test");
class PageHeaderComponent {
    page;
    title;
    subtitle;
    constructor(page, containerTestId) {
        this.page = page;
        const container = page.locator(`[data-testid="${containerTestId}"]`);
        this.title = container.locator('[data-testid="login__title"]');
        this.subtitle = container.locator('[data-testid="login__subtitle"]');
    }
    async getTitle() {
        return await this.title.textContent() || '';
    }
    async getSubtitle() {
        return await this.subtitle.textContent() || '';
    }
    async verifyContent(expectedTitle, expectedSubtitle) {
        await (0, test_1.expect)(this.title).toHaveText(expectedTitle);
        if (expectedSubtitle) {
            await (0, test_1.expect)(this.subtitle).toHaveText(expectedSubtitle);
        }
    }
}
exports.PageHeaderComponent = PageHeaderComponent;
