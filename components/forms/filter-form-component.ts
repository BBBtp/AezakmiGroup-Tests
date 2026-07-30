import { Page, Locator, expect } from '@playwright/test';
import { requireTestId } from '../../utils/test-id';
import { loggedClick, loggedFill, loggedSelectOption } from '../../utils/playwright-logger';

/**
 * Компонент формы фильтров.
 *
 * Page Object для работы с фильтрами на странице.
 * Поддерживает:
 * - установка значений в текстовые поля;
 * - выбор значений из селектов;
 * - кнопки применения и сброса фильтров;
 * - проверку применения фильтров.
 *
 * Ожидаемая структура data-testid:
 * - `${testId}` — корень формы
 * - `${testId}__apply` — кнопка применить
 * - `${testId}__reset` — кнопка сброс
 * - `${testId}__input-<name>` — текстовые поля
 * - `${testId}__select-<name>` — селекты
 */
export class FilterFormComponent {
  /**
   * Экземпляр страницы Playwright
   */
  readonly page: Page;

  /**
   * Корневой элемент формы фильтров
   */
  readonly root: Locator;

  /**
   * Базовый data-testid компонента
   */
  private readonly testId: string;

  /**
   * Кнопка применения фильтров
   */
  readonly applyButton: Locator;

  /**
   * Кнопка сброса фильтров
   */
  readonly resetButton: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   * @param testId Базовый data-testid формы фильтров (по умолчанию "filter-form")
   */
  constructor(page: Page, testId: string = 'filter-form') {
    this.page = page;
    this.testId = requireTestId(testId, 'FilterFormComponent');
    this.root = page.locator(`[data-testid="${this.testId}"]`);
    this.applyButton = page.locator(`[data-testid="${this.testId}__apply"]`);
    this.resetButton = page.locator(`[data-testid="${this.testId}__reset"]`);
  }

  /**
   * Ожидает готовности формы к взаимодействию
   */
  async waitForReady(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /**
   * Устанавливает значение в текстовое поле фильтра
   *
   * @param name имя поля (суффикс в data-testid)
   * @param value значение для ввода
   */
  async setInputValue(name: string, value: string): Promise<void> {
    const input = this.page.locator(`[data-testid="${this.testId}__input-${name}"]`);
    await loggedFill(this.page, `filter ${name}: fill value`, input, value);
  }

  /**
   * Выбирает значение из селекта фильтра
   *
   * @param name имя селекта (суффикс в data-testid)
   * @param value значение для выбора (label)
   */
  async selectValue(name: string, value: string): Promise<void> {
    const select = this.page.locator(`[data-testid="${this.testId}__select-${name}"]`);
    await loggedSelectOption(this.page, `filter ${name}: select ${value}`, select, { label: value });
  }

  /**
   * Применяет фильтры (нажатие кнопки Apply)
   */
  async apply(): Promise<void> {
    await loggedClick(this.page, 'filters: apply', this.applyButton);
  }

  /**
   * Сбрасывает фильтры (нажатие кнопки Reset)
   */
  async reset(): Promise<void> {
    await loggedClick(this.page, 'filters: reset', this.resetButton);
  }

  /**
   * Проверяет, что фильтры были применены.
   *
   * По умолчанию проверяется видимость основного контента страницы.
   */
  async verifyFiltersApplied(): Promise<void> {
    await expect(this.page.locator('[data-testid="main-content"]')).toBeVisible();
  }
}
