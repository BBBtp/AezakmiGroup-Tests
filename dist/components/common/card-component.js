"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardComponent = void 0;
const test_1 = require("@playwright/test");
class CardComponent {
    root;
    title;
    mainValue;
    absValue;
    percentValue;
    period;
    constructor(page, testId) {
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.title = this.root.locator(`[data-testid="${testId}__title"]`);
        this.mainValue = this.root.locator(`[data-testid^="${testId}__"][data-testid$="currency"], [data-testid$="main"]`);
        this.absValue = this.root.locator(`[data-testid="${testId}__abs"]`);
        this.percentValue = this.root.locator(`[data-testid="${testId}__percentage-value"]`);
        this.period = this.root.locator(`[data-testid="${testId}__period"]`);
    }
    /** Ассерты на видимость элементов карточки */
    async assertVisible(cardTitle) {
        await (0, test_1.expect)(this.root).toBeVisible();
        await (0, test_1.expect)(this.title).toBeVisible();
        await (0, test_1.expect)(this.title).toHaveText(cardTitle);
        await (0, test_1.expect)(this.mainValue).toBeVisible();
        await (0, test_1.expect)(this.absValue).toBeVisible();
        await (0, test_1.expect)(this.percentValue).toBeVisible();
        await (0, test_1.expect)(this.period).toBeVisible();
    }
}
exports.CardComponent = CardComponent;
