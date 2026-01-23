import { Page, Locator } from '@playwright/test';

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
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.title = this.root.locator(`[data-testid="${testId}__title"]`);
        this.message = this.root.locator(`[data-testid="${testId}__message"]`);
    }
}
