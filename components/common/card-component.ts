import { Page, Locator, expect } from '@playwright/test';
import { requireTestId } from '../../utils/test-id';

/**
 * Компонент карточки с метриками.
 *
 * Page Object для UI-карточек, отображающих:
 * - заголовок;
 * - основное значение;
 * - абсолютное изменение;
 * - процентное изменение;
 * - период данных.
 *
 * Компонент ориентирован на использование в автотестах
 * аналитических и дашбордных страниц.
 */
export class CardComponent {
    /**
     * Корневой элемент карточки
     */
    readonly root: Locator;

    /**
     * Заголовок карточки
     */
    readonly title: Locator;

    /**
     * Основное значение карточки (валюта / основное число)
     *
     * Локатор поддерживает разные варианты data-testid
     * (`currency`, `main`) для переиспользования компонента.
     */
    readonly mainValue: Locator;

    /**
     * Абсолютное изменение значения
     */
    readonly absValue: Locator;

    /**
     * Процентное изменение значения
     */
    readonly percentValue: Locator;

    /**
     * Период, за который отображаются данные
     */
    readonly period: Locator;

    /**
     * @param page Экземпляр страницы Playwright
     * @param testId Базовый data-testid карточки
     *
     * Ожидаемая структура testId:
     * - `${testId}`
     * - `${testId}__title`
     * - `${testId}__abs`
     * - `${testId}__percentage-value`
     * - `${testId}__period`
     *
     * Основное значение может иметь разные суффиксы:
     * - `${testId}__*currency`
     * - `${testId}__*main`
     */
    constructor(page: Page, testId: string) {
        const normalizedTestId = requireTestId(testId, 'CardComponent');
        this.root = page.locator(
            `[data-testid="${normalizedTestId}"]`
        );
        this.title = this.root.locator(
            `[data-testid="${normalizedTestId}__title"]`
        );
        this.mainValue = this.root.locator(
            `[data-testid^="${normalizedTestId}__"][data-testid$="currency"], [data-testid$="main"]`
        );
        this.absValue = this.root.locator(
            `[data-testid="${normalizedTestId}__abs"]`
        );
        this.percentValue = this.root.locator(
            `[data-testid="${normalizedTestId}__percentage-value"]`
        );
        this.period = this.root.locator(
            `[data-testid="${normalizedTestId}__period"]`
        );
    }

    /**
     * Проверяет, что карточка полностью отображается
     * и содержит корректный заголовок.
     *
     * @param cardTitle ожидаемый текст заголовка карточки
     *
     * Проверяет:
     * - видимость корневого элемента;
     * - наличие и текст заголовка;
     * - отображение всех ключевых значений карточки.
     */
    async assertVisible(cardTitle: string): Promise<void> {
        await expect(this.root).toBeVisible();

        await expect(this.title).toBeVisible();
        await expect(this.title).toContainText(cardTitle);

        await expect(this.mainValue).toBeVisible();
        await expect(this.absValue).toBeVisible();
        await expect(this.percentValue).toBeVisible();
        await expect(this.period).toBeVisible();
    }
}
