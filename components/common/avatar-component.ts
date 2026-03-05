import { Page, Locator } from '@playwright/test';
import { requireTestId } from '../../utils/test-id';

/**
 * Компонент аватара пользователя.
 *
 * Универсальный Page Object компонент, предназначенный для работы
 * с блоком аватара и связанной с ним текстовой информацией.
 *
 * Компонент поддерживает:
 * - заголовок (обычно имя пользователя);
 * - подзаголовок (дополнительная информация);
 * - под-ссылку (действие или навигация);
 * - тултип для под-ссылки.
 *
 * Все элементы ищутся по `data-testid`, формируемым
 * на основе базового `testId`.
 */
export class AvatarComponent {
    /**
     * Корневой элемент компонента аватара
     */
    readonly root: Locator;

    /**
     * Заголовок (имя пользователя)
     */
    readonly title: Locator;

    /**
     * Подзаголовок (дополнительное описание)
     */
    readonly subtitle: Locator;

    /**
     * Под-ссылка (действие, связанное с аватаром)
     */
    readonly sublink: Locator;

    /**
     * Тултип для под-ссылки
     */
    readonly tooltip: Locator;

    /**
     * @param page Экземпляр страницы Playwright
     * @param testId Базовый data-testid компонента аватара
     *
     * Пример структуры testId:
     * - `${testId}`
     * - `${testId}-title`
     * - `${testId}-subtitle`
     * - `${testId}-sublink`
     * - `${testId}-sublink_tooltip`
     */
    constructor(page: Page, testId: string) {
        const normalizedTestId = requireTestId(testId, 'AvatarComponent');
        this.root = page.locator(
            `[data-testid="${normalizedTestId}"]`
        );
        this.title = page.locator(
            `[data-testid="${normalizedTestId}-title"]`
        );
        this.subtitle = page.locator(
            `[data-testid="${normalizedTestId}-subtitle"]`
        );
        this.sublink = page.locator(
            `[data-testid="${normalizedTestId}-sublink"]`
        );
        this.tooltip = page.locator(
            `[data-testid="${normalizedTestId}-sublink_tooltip"]`
        );
    }
}
