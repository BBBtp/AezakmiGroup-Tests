import { Page, Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
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
export class DescriptionComponent extends UiObject {
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
    super(page);
    const normalizedTestId = requireTestId(testId, 'DescriptionComponent');
    this.root = this.locate.testId(normalizedTestId);
    const description = this.locate.within(this.root);
    this.title = description.testId(`${normalizedTestId}__title`);
    this.message = description.testId(`${normalizedTestId}__message`);
  }
}
