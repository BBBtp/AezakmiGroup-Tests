"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterFormComponent = void 0;
const test_1 = require("@playwright/test");
class FilterFormComponent {
    page;
    root;
    testId;
    applyButton;
    resetButton;
    constructor(page, testId = 'filter-form') {
        this.page = page;
        this.testId = testId;
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.applyButton = page.locator(`[data-testid="${testId}__apply"]`);
        this.resetButton = page.locator(`[data-testid="${testId}__reset"]`);
    }
    /**
     * Проверяет, что форма фильтрации доступна и видима
     */
    async waitForReady() {
        await (0, test_1.expect)(this.root).toBeVisible();
    }
    /**
     * Устанавливает значение в input-поле по имени
     * @param name - имя поля (например, 'month' или 'employee')
     * @param value - вводимое значение
     */
    async setInputValue(name, value) {
        const input = this.page.locator(`[data-testid="${this.testId}__input-${name}"]`);
        await input.fill(value);
    }
    /**
     * Выбирает значение из селектора
     * @param name - имя селектора (например, 'status')
     * @param value - видимое значение опции
     */
    async selectValue(name, value) {
        const select = this.page.locator(`[data-testid="${this.testId}__select-${name}"]`);
        await select.selectOption({ label: value });
    }
    /**
     * Применяет фильтры
     */
    async apply() {
        await this.applyButton.click();
    }
    /**
     * Сбрасывает фильтры
     */
    async reset() {
        await this.resetButton.click();
    }
    /**
     * Проверка, что фильтр применился (например, обновился контент)
     * — опционально, зависит от реализации
     */
    async verifyFiltersApplied() {
        await (0, test_1.expect)(this.page.locator('[data-testid="main-content"]')).toBeVisible();
    }
}
exports.FilterFormComponent = FilterFormComponent;
