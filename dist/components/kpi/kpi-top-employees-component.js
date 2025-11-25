"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiTopEmployeesComponent = void 0;
const test_1 = require("@playwright/test");
const podium_item_component_1 = require("./podium-item-component");
const contender_item_component_1 = require("./contender-item-component");
class KpiTopEmployeesComponent {
    root;
    title;
    podium;
    podiumItems;
    contendersRoot;
    constructor(page) {
        this.root = page.locator('[data-testid="top-employees"]');
        this.title = this.root.locator('[data-testid="top-employees__title"]');
        this.podium = this.root.locator('[data-testid="top-employees__podium"]');
        this.podiumItems = [
            new podium_item_component_1.PodiumItemComponent(this.podium, 0),
            new podium_item_component_1.PodiumItemComponent(this.podium, 1),
            new podium_item_component_1.PodiumItemComponent(this.podium, 2),
        ];
        this.contendersRoot = this.root.locator('[data-testid="top-employees__contenders"]');
    }
    /** Получить количество претендентов */
    async getContendersCount() {
        // Считаем блоки которые содержат весь контент претендента
        return this.contendersRoot.locator('[data-testid^="contender-"]:not([data-testid*="avatar"]):not([data-testid*="name"]):not([data-testid*="currency"])').count();
    }
    /** Получить претендента по индексу */
    getContender(index) {
        return new contender_item_component_1.ContenderItemComponent(this.contendersRoot, index);
    }
    /** Получить всех претендентов как объекты */
    async getContenders() {
        const count = await this.getContendersCount();
        return Array.from({ length: count }, (_, i) => this.getContender(i));
    }
    async verifyVisible(expectedTitle) {
        await (0, test_1.expect)(this.root).toBeVisible();
        await (0, test_1.expect)(this.title).toHaveText(expectedTitle);
    }
    async verifyPodium() {
        await (0, test_1.expect)(this.podium).toBeVisible();
        for (const item of this.podiumItems) {
            await item.verify();
        }
    }
    async verifyContenders() {
        await (0, test_1.expect)(this.contendersRoot).toBeVisible({ timeout: 10000 });
        const contendersCount = await this.getContendersCount();
        for (let i = 0; i < contendersCount; i++) {
            const contender = this.getContender(i);
            if (await contender.root.count() > 0) {
                await contender.verify();
            }
        }
    }
}
exports.KpiTopEmployeesComponent = KpiTopEmployeesComponent;
