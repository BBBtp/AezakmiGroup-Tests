import { Page, Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';

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
export class WarningComponent extends UiObject {
  /**
   * Корневой элемент предупреждения
   */
  readonly root: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   * @param testId data-testid предупреждающего блока (по умолчанию "month-end-warning")
   */
  constructor(page: Page, testId = 'month-end-warning') {
    super(page);
    this.root = this.locate.testId(testId);
  }
}
