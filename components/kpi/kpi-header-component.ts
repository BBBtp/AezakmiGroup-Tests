import { Page, Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiTestIds } from '@locators/kpi';

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
    this.root = this.locate.testId(kpiTestIds.page);
    const header = this.locate.within(this.root);
    this.settingsButton = header.testId(kpiTestIds.settingsButton);
    this.subtitle = header.testId(kpiTestIds.subtitle);
    this.errorBlock = header.testId(kpiTestIds.errorContent);
  }
}
