"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabsComponent = void 0;
const test_1 = require("@playwright/test");
class TabsComponent {
    root;
    testId;
    constructor(page, testId) {
        this.testId = testId;
        this.root = page.locator(`[data-testid="${testId}"]`);
    }
    getTab(value) {
        return this.root.locator(`[data-testid="${this.testId}__${value}"]`);
    }
    async clickTab(value) {
        await this.root.locator(`[data-testid$="__${value}"]`).click();
    }
    async verifyTabsVisible(values) {
        for (const v of values) {
            await (0, test_1.expect)(this.root.locator(`[data-testid$="__${v}"]`)).toBeVisible();
        }
    }
}
exports.TabsComponent = TabsComponent;
