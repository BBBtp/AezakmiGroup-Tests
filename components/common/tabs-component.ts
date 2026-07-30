import { type Page, type Locator, expect } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { requireTestId } from '../../utils/test-id';

/**
 * Компонент вкладок (Tabs).
 *
 * Универсальный Page Object для работы с табами на странице.
 * Поддерживает:
 * - получение конкретного таба по значению;
 * - клик по табу;
 * - проверку видимости всех табов.
 *
 * Таб должен иметь data-testid в формате:
 * `${testId}__<value>` для каждой вкладки.
 */
export class TabsComponent extends UiObject {
  /**
   * Корневой элемент компонента табов
   */
  readonly root: Locator;

  /**
   * Базовый data-testid компонента
   */
  private readonly testId: string;

  /**
   * @param page Экземпляр страницы Playwright
   * @param testId Базовый data-testid компонента вкладок
   *
   * Пример:
   * Если testId = "profile-tabs",
   * то отдельный таб имеет testId = "profile-tabs__settings"
   */
  constructor(page: Page, testId: string) {
    super(page);
    this.testId = requireTestId(testId, 'TabsComponent');
    this.root = this.locate.testId(this.testId);
  }

  /**
   * Возвращает локатор конкретного таба по его значению
   *
   * @param value значение таба (суффикс в data-testid)
   * @returns локатор вкладки
   */
  getTab(value: string): Locator {
    return this.locate.within(this.root).testId(`${this.testId}__${value}`);
  }

  /**
   * Кликает по вкладке с заданным значением
   *
   * @param value значение таба (суффикс в data-testid)
   */
  async clickTab(value: string): Promise<void> {
    await this.actions.click(
      `tabs ${this.testId}: ${value}`,
      this.locate.within(this.root).css(`[data-testid$="__${value}"]`),
    );
  }

  /**
   * Проверяет, что все вкладки из массива видимы
   *
   * @param values массив значений вкладок
   */
  async verifyTabsVisible(values: string[]): Promise<void> {
    for (const v of values) {
      await expect(this.locate.within(this.root).css(`[data-testid$="__${v}"]`)).toBeVisible();
    }
  }
}
