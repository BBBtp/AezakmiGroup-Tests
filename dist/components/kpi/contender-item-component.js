"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContenderItemComponent = void 0;
const test_1 = require("@playwright/test");
class ContenderItemComponent {
    root;
    name;
    currency;
    avatarLetter;
    //TODO: Добавить индикатор для места в топе
    constructor(root, index) {
        this.root = root.locator(`[data-testid="contender-${index}"]`);
        this.name = this.root.locator(`[data-testid="contender-${index}__name"]`);
        this.currency = this.root.locator(`[data-testid="contender-${index}__currency"] p`);
        this.avatarLetter = this.root.locator(`[data-testid="contender-${index}-avatar"] p`).first();
    }
    async verify() {
        await (0, test_1.expect)(this.root).toBeVisible();
        await (0, test_1.expect)(this.name).toBeVisible();
        await (0, test_1.expect)(this.currency).toBeVisible();
        await (0, test_1.expect)(this.avatarLetter).toBeVisible();
        const nameText = (await this.name.textContent())?.trim() || '';
        const avatarText = (await this.avatarLetter.textContent())?.trim() || '';
        const expectedInitial = nameText.charAt(0).toUpperCase();
        await (0, test_1.expect)(avatarText).toBe(expectedInitial);
    }
}
exports.ContenderItemComponent = ContenderItemComponent;
