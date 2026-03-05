import { Page, Locator, expect } from '@playwright/test';
import { requireTestId } from '../../utils/test-id';

/**
 * Базовый компонент модального окна.
 *
 * Предоставляет универсальные методы для:
 * - ожидания открытия и закрытия модали;
 * - закрытия модали различными способами;
 * - получения заголовка модального окна;
 * - принудительного закрытия (forceClose).
 *
 * Этот компонент используется как базовый для всех Page Object модалей.
 */
export class ModalComponent {
    /**
     * Экземпляр страницы Playwright
     */
    page: Page;

    /**
     * Корневой элемент модального окна
     */
    modal: Locator;

    /**
     * Кнопка закрытия модального окна
     */
    closeButton: Locator;

    /**
     * Заголовок модального окна
     */
    title: Locator;

    /**
     * @param page Экземпляр страницы Playwright
     * @param modalTestId data-testid корневого модального окна
     */
    constructor(page: Page, modalTestId: string) {
        this.page = page;
        const normalizedModalTestId = requireTestId(modalTestId, 'ModalComponent');

        // Корень модального окна
        this.modal = page.locator(`[data-testid="${normalizedModalTestId}"]`);

        // Кнопка закрытия модального окна
        this.closeButton = this.modal.locator(
            '[data-testid="login__forgot-password-modal__close"]'
        );

        // Заголовок модального окна
        this.title = this.modal.locator('.modal-title, h2, h3');
    }

    /**
     * Ожидает открытия модального окна
     */
    async waitForOpen(): Promise<void> {
        await expect(this.modal).toBeVisible();
    }

    /**
     * Ожидает закрытия модального окна
     */
    async waitForClose(): Promise<void> {
        await expect(this.modal).not.toBeVisible();
    }

    /**
     * Закрывает модальное окно безопасным образом:
     * через кнопку или клик вне модали.
     */
    async close(): Promise<void> {
        if (await this.closeButton.isVisible()) {
            await this.closeButton.click();
        } else {
            await this.closeByClickOutside();
        }
        await this.waitForClose();
    }

    /**
     * Закрывает модальное окно кликом вне него
     */
    async closeByClickOutside(): Promise<void> {
        await this.page.mouse.click(1, 1);
        if (await this.modal.isVisible().catch(() => false)) {
            await this.page.keyboard.press('Escape');
            if (await this.modal.isVisible().catch(() => false)) {
                await this.page.mouse.click(1, 1);
            }
        }
        await this.waitForClose();
    }

    /**
     * Закрывает модальное окно через оверлей (клик вне модали)
     */
    async closeByOverlay(): Promise<void> {
        await this.closeByClickOutside();
    }

    /**
     * Закрывает модальное окно через кнопку закрытия
     */
    async closeByButton(): Promise<void> {
        await this.closeButton.click();
        await this.waitForClose();
    }

    /**
     * Закрывает модальное окно нажатием Escape
     */
    async closeByEscape(): Promise<void> {
        await this.page.keyboard.press('Escape');
        await this.waitForClose();
    }

    /**
     * Возвращает текст заголовка модального окна
     *
     * @returns текст заголовка или пустую строку
     */
    async getTitle(): Promise<string> {
        return (await this.title.textContent()) || '';
    }

    /**
     * Принудительно закрывает модальное окно,
     * перебирая разные методы закрытия.
     */
    async forceClose(): Promise<void> {
        const closeMethods = [
            () => this.closeByButton(),
            () => this.closeByEscape(),
            () => this.closeByClickOutside()
        ];

        for (const method of closeMethods) {
            try {
                await method();
                if (!(await this.modal.isVisible())) break;
            } catch (error) {
                continue;
            }
        }
    }
}
