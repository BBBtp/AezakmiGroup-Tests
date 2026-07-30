import { Page, Locator, expect } from '@playwright/test';
import { requireTestId } from '../../../utils/test-id';

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
export class PageHeaderComponent {
  /**
   * Экземпляр страницы Playwright
   */
  page: Page;

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
  constructor(page: Page, containerTestId: string) {
    this.page = page;
    const normalizedContainerTestId = requireTestId(containerTestId, 'PageHeaderComponent');

    // Корневой контейнер заголовка
    const container = page.locator(`[data-testid="${normalizedContainerTestId}"]`);

    // Локаторы элементов заголовка
    this.title = container.locator('[data-testid="login__title"]');
    this.subtitle = container.locator('[data-testid="login__subtitle"]');
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
    await expect(this.title).toHaveText(expectedTitle);

    if (expectedSubtitle) {
      await expect(this.subtitle).toHaveText(expectedSubtitle);
    }
  }
}
