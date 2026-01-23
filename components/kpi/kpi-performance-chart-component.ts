import { Page, Locator, expect } from '@playwright/test';

/**
 * Компонент графика KPI Performance.
 *
 * Page Object для работы с графиком KPI на странице.
 * Поддерживает:
 * - проверку видимости графика;
 * - работу с вкладками графика (Score и MRR);
 * - получение заголовка графика.
 */
export class KpiPerformanceChartComponent {
    /** Корневой элемент графика KPI */
    readonly root: Locator;

    /** Заголовок графика */
    readonly title: Locator;

    /** Контейнер вкладок графика */
    readonly tabs: Locator;

    /** Вкладка "Score" */
    readonly scoreTab: Locator;

    /** Вкладка "MRR" */
    readonly mrrTab: Locator;

    /**
     * @param page Экземпляр страницы Playwright
     */
    constructor(page: Page) {
        this.root = page.locator('[data-testid="performance-chart"]');
        this.title = this.root.locator('[data-testid="chart-title"]');
        this.tabs = this.root.locator('[data-testid="chart-tabs"]');
        this.scoreTab = this.root.locator('[data-testid="chart-tabs__Score"]');
        this.mrrTab = this.root.locator('[data-testid="chart-tabs__MRR"]');
    }

    /**
     * Проверяет видимость графика и основных вкладок
     */
    async verifyVisible(): Promise<void> {
        await expect(this.root).toBeVisible();
        await expect(this.scoreTab).toBeVisible();
        await expect(this.mrrTab).toBeVisible();
    }
}
