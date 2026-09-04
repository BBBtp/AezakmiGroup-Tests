import { Page, Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { commonComponentSelectors } from '@locators/common';

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
  readonly tooltipTrigger: Locator;
  readonly tooltipPopup: Locator;

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
    const selectors = commonComponentSelectors.card(testId);
    this.root = this.locate.testId(selectors.root);
    const card = this.locate.within(this.root);
    this.title = card.testId(selectors.title);
    this.mainValue = card.css(selectors.mainValue);
    this.absValue = card.testId(selectors.absoluteValue);
    this.percentValue = card.testId(selectors.percentageValue);
    this.period = card.testId(selectors.period);
    this.tooltipTrigger = card.css(selectors.tooltipButton).first();
    this.tooltipPopup = this.locate.css(selectors.tooltipPopup);
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

  async hoverTooltip(): Promise<void> {
    await this.actions.hover('информационная подсказка карточки', this.tooltipTrigger);
    await this.expectations.visible('информационная подсказка карточки', this.tooltipPopup);
  }

  async expectTooltipText(value: string): Promise<void> {
    await this.expectations.containsText('текст информационной подсказки карточки', this.tooltipPopup, value);
  }

  async expectTooltipWidthAtMost(maximum: number): Promise<void> {
    await this.expectations.widthAtMost(
      'максимальная ширина информационной подсказки карточки',
      this.tooltipPopup,
      maximum,
    );
  }
}
