"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodiumItemComponent = void 0;
const test_1 = require("@playwright/test");
class PodiumItemComponent {
    root;
    name;
    currency;
    //TODO: Добавить локатор для инициала аватара и локатор для места в топе
    constructor(root, index) {
        this.root = root.locator(`[data-testid="podium-${index}"]`);
        this.name = this.root.locator(`[data-testid="podium-${index}__name"]`);
        this.currency = this.root.locator(`[data-testid="podium-${index}__currency"] p`);
    }
    async verify() {
        await (0, test_1.expect)(this.root).toBeVisible();
        await (0, test_1.expect)(this.name).toBeVisible();
        await (0, test_1.expect)(this.currency).toBeVisible();
        const text = await this.currency.textContent();
        await (0, test_1.expect)(text?.trim().length).toBeGreaterThan(0);
    }
}
exports.PodiumItemComponent = PodiumItemComponent;
