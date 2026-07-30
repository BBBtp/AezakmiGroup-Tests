import { Page, Locator } from '@playwright/test';

/**
 * Компонент предупреждения (Warning).
 *
 * Универсальный Page Object для работы с предупреждающими блоками.
 * Обычно используется для отображения предупреждений о действиях,
 * сроках, ограничениях и т.п.
 *
 * Ожидаемая структура data-testid:
 * - `${testId}` — корневой элемент предупреждения
 *
 * По умолчанию используется testId = "month-end-warning".
 */
export class WarningComponent {
  /**
   * Корневой элемент предупреждения
   */
  readonly root: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   * @param testId data-testid предупреждающего блока (по умолчанию "month-end-warning")
   */
  constructor(page: Page, testId = 'month-end-warning') {
    this.root = page.locator(`[data-testid="${testId}"]`);
  }
}
