import { type Page, type Locator, expect } from '@playwright/test';
import { UiObject } from '@framework/ui';

/**
 * Компонент графика KPI Performance.
 *
 * Page Object для работы с графиком KPI на странице.
 * Поддерживает:
 * - проверку видимости графика;
 * - работу с вкладками графика (Score и MRR);
 * - получение заголовка графика.
 */
export class KpiPerformanceChartComponent extends UiObject {
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
    super(page);
    this.root = this.locate.testId('performance-chart');
    const chart = this.locate.within(this.root);
    this.title = chart.testId('chart-title');
    this.tabs = chart.testId('chart-tabs');
    this.scoreTab = chart.testId('chart-tabs__Score');
    this.mrrTab = chart.testId('chart-tabs__MRR');
  }

  /**
   * Проверяет видимость графика и основных вкладок
   */
  async verifyVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.scoreTab).toBeVisible();
    await expect(this.mrrTab).toBeVisible();
  }

  async selectScore(): Promise<void> {
    await this.actions.click('KPI chart: Score tab', this.scoreTab);
  }

  async selectMrr(): Promise<void> {
    await this.actions.click('KPI chart: MRR tab', this.mrrTab);
  }
}
