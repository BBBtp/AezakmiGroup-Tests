import { Page, Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { requireTestId } from '../../utils/test-id';

/**
 * Компонент уведомления (Toast / Alert).
 *
 * Универсальный Page Object для работы с всплывающими уведомлениями.
 * Поддерживает:
 * - заголовок уведомления;
 * - подзаголовок / дополнительное сообщение.
 *
 * Ожидаемая структура data-testid:
 * - `${testId}` — корень уведомления
 * - `${testId}__alert-title` — заголовок
 * - `${testId}__alert-subtitle` — подзаголовок
 */
export class ToastComponent extends UiObject {
  /**
   * Корневой элемент уведомления
   */
  readonly root: Locator;

  /**
   * Заголовок уведомления
   */
  readonly title: Locator;

  /**
   * Подзаголовок / сообщение уведомления
   */
  readonly subtitle: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   * @param testId Базовый data-testid уведомления
   */
  constructor(page: Page, testId: string) {
    super(page);
    const normalizedTestId = requireTestId(testId, 'ToastComponent');
    this.root = this.locate.testId(normalizedTestId);
    const toast = this.locate.within(this.root);
    this.title = toast.css('[data-testid$="__alert-title"]');
    this.subtitle = toast.css('[data-testid$="__alert-subtitle"]');
  }
}
