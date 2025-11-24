import { Page, Locator, expect } from '@playwright/test';


export class FilterFormComponent {
    readonly page: Page;
    readonly root: Locator;
    private readonly testId: string;

    readonly applyButton: Locator;
    readonly resetButton: Locator;

    constructor(page: Page, testId: string = 'filter-form') {
        this.page = page;
        this.testId = testId;
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.applyButton = page.locator(`[data-testid="${testId}__apply"]`);
        this.resetButton = page.locator(`[data-testid="${testId}__reset"]`);
    }

    /**
     * Проверяет, что форма фильтрации доступна и видима
     */
    async waitForReady(): Promise<void> {
        await expect(this.root).toBeVisible();
    }

    /**
     * Устанавливает значение в input-поле по имени
     * @param name - имя поля (например, 'month' или 'employee')
     * @param value - вводимое значение
     */
    async setInputValue(name: string, value: string): Promise<void> {
        const input = this.page.locator(`[data-testid="${this.testId}__input-${name}"]`);
        await input.fill(value);
    }

    /**
     * Выбирает значение из селектора
     * @param name - имя селектора (например, 'status')
     * @param value - видимое значение опции
     */
    async selectValue(name: string, value: string): Promise<void> {
        const select = this.page.locator(`[data-testid="${this.testId}__select-${name}"]`);
        await select.selectOption({ label: value });
    }

    /**
     * Применяет фильтры
     */
    async apply(): Promise<void> {
        await this.applyButton.click();
    }

    /**
     * Сбрасывает фильтры
     */
    async reset(): Promise<void> {
        await this.resetButton.click();
    }

    /**
     * Проверка, что фильтр применился (например, обновился контент)
     * — опционально, зависит от реализации
     */
    async verifyFiltersApplied(): Promise<void> {
        await expect(this.page.locator('[data-testid="main-content"]')).toBeVisible();
    }
}
