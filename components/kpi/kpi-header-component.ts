import { Page, Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';

/**
 * Компонент заголовка KPI блока.
 *
 * Page Object для работы с верхним блоком KPI.
 * Поддерживает:
 * - кнопку настроек;
 * - подзаголовок блока;
 * - блок ошибок.
 */
export class KpiHeaderComponent extends UiObject {
  /** Корневой элемент KPI блока */
  readonly root: Locator;

  /** Кнопка настроек KPI */
  readonly settingsButton: Locator;

  /** Подзаголовок блока KPI */
  readonly subtitle: Locator;

  /** Блок с ошибкой KPI */
  readonly errorBlock: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   */
  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId('kpi');
    const header = this.locate.within(this.root);
    this.settingsButton = header.testId('settings-button');
    this.subtitle = header.testId('subtitle');
    this.errorBlock = header.testId('error-content');
  }
}
