import { Page, Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';

export type PageHeaderTestIds = {
  container: string;
  title: string;
  subtitle: string;
};

/**
 * Компонент заголовка страницы.
 *
 * Универсальный Page Object для проверки заголовка и подзаголовка
 * внутри переданного контейнера.
 *
 * Используется на страницах:
 * - логина;
 * - регистрации;
 * - восстановления пароля;
 * и других страницах с единым layout-заголовком.
 */
export class PageHeaderComponent extends UiObject {
  /**
   * Заголовок страницы
   */
  title: Locator;

  /**
   * Подзаголовок страницы
   */
  subtitle: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   * @param containerTestId data-testid контейнера,
   * внутри которого расположен заголовок страницы
   */
  constructor(page: Page, testIds: PageHeaderTestIds) {
    super(page);

    // Корневой контейнер заголовка
    const container = this.locate.testId(testIds.container);
    const header = this.locate.within(container);

    // Локаторы элементов заголовка
    this.title = header.testId(testIds.title);
    this.subtitle = header.testId(testIds.subtitle);
  }

  /**
   * Возвращает текст заголовка страницы.
   *
   * @returns текст заголовка или пустую строку,
   * если элемент не содержит текста
   */
  async getTitle(): Promise<string> {
    return (await this.title.textContent()) || '';
  }

  /**
   * Возвращает текст подзаголовка страницы.
   *
   * @returns текст подзаголовка или пустую строку,
   * если элемент не содержит текста
   */
  async getSubtitle(): Promise<string> {
    return (await this.subtitle.textContent()) || '';
  }

  /**
   * Проверяет соответствие заголовка и подзаголовка ожидаемым значениям.
   *
   * @param expectedTitle ожидаемый текст заголовка
   * @param expectedSubtitle ожидаемый текст подзаголовка (опционально)
   *
   * Если `expectedSubtitle` не передан,
   * проверка подзаголовка не выполняется.
   */
  async verifyContent(expectedTitle: string, expectedSubtitle?: string): Promise<void> {
    await this.expectations.text('page title', this.title, expectedTitle);

    if (expectedSubtitle) {
      await this.expectations.text('page subtitle', this.subtitle, expectedSubtitle);
    }
  }
}
