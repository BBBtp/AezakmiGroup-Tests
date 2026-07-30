import { Page, Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
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
export class CardComponent extends UiObject {
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
    super(page);
    const normalizedTestId = requireTestId(testId, 'CardComponent');
    this.root = this.locate.testId(normalizedTestId);
    const card = this.locate.within(this.root);
    this.title = card.testId(`${normalizedTestId}__title`);
    this.mainValue = card.css(
      `[data-testid^="${normalizedTestId}__"][data-testid$="currency"], [data-testid$="main"]`,
    );
    this.absValue = card.testId(`${normalizedTestId}__abs`);
    this.percentValue = card.testId(`${normalizedTestId}__percentage-value`);
    this.period = card.testId(`${normalizedTestId}__period`);
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
    await this.expectations.visible(`${cardTitle} KPI card`, this.root);
    await this.expectations.visible(`${cardTitle} KPI card title`, this.title);
    await this.expectations.containsText(`${cardTitle} KPI card title`, this.title, cardTitle);
    await this.expectations.visible(`${cardTitle} KPI card main value`, this.mainValue);
    await this.expectations.visible(`${cardTitle} KPI card absolute value`, this.absValue);
    await this.expectations.visible(`${cardTitle} KPI card percentage`, this.percentValue);
    await this.expectations.visible(`${cardTitle} KPI card period`, this.period);
  }
}
