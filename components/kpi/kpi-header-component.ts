import { Page, Locator } from '@playwright/test';

/**
 * Компонент заголовка KPI блока.
 *
 * Page Object для работы с верхним блоком KPI.
 * Поддерживает:
 * - кнопку настроек;
 * - подзаголовок блока;
 * - блок ошибок.
 */
export class KpiHeaderComponent {
  /** Корневой элемент KPI блока */
  readonly root: Locator;

  /** Кнопка настроек KPI */
  readonly settingsButton: Locator;

  /** Подзаголовок блока KPI */
  readonly subtitle: Locator;

  /** Блок с ошибкой KPI */
  readonly errorBlock: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   */
  constructor(page: Page) {
    this.root = page.locator('[data-testid="kpi"]');
    this.settingsButton = this.root.locator('[data-testid="settings-button"]');
    this.subtitle = this.root.locator('[data-testid="subtitle"]');
    this.errorBlock = this.root.locator('[data-testid="error-content"]');
  }
}
