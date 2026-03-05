import { Page, Locator } from '@playwright/test';
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
export class ToastComponent {
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
        const normalizedTestId = requireTestId(testId, 'ToastComponent');
        this.root = page.locator(`[data-testid="${normalizedTestId}"]`);
        this.title = this.root.locator(`[data-testid$="__alert-title"]`);
        this.subtitle = this.root.locator(`[data-testid$="__alert-subtitle"]`);
    }
}
