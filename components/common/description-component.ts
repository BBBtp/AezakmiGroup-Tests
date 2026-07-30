import { Page, Locator } from '@playwright/test';
import { requireTestId } from '../../utils/test-id';

/**
 * Компонент описания или информационного блока.
 *
 * Page Object для работы с блоками, содержащими:
 * - заголовок (`title`);
 * - текстовое сообщение (`message`).
 *
 * Используется для:
 * - уведомлений;
 * - инструкций;
 * - информационных карточек.
 */
export class DescriptionComponent {
  /**
   * Корневой элемент компонента
   */
  readonly root: Locator;

  /**
   * Заголовок блока
   */
  readonly title: Locator;

  /**
   * Сообщение / текст внутри блока
   */
  readonly message: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   * @param testId Базовый data-testid компонента
   *
   * Ожидаемая структура testId:
   * - `${testId}`
   * - `${testId}__title`
   * - `${testId}__message`
   */
  constructor(page: Page, testId: string) {
    const normalizedTestId = requireTestId(testId, 'DescriptionComponent');
    this.root = page.locator(`[data-testid="${normalizedTestId}"]`);
    this.title = this.root.locator(`[data-testid="${normalizedTestId}__title"]`);
    this.message = this.root.locator(`[data-testid="${normalizedTestId}__message"]`);
  }
}
