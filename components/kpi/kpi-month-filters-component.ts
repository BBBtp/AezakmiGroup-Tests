import { type Page, type Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiTestIds } from '@locators/kpi';
import { requireTestId } from '../../utils/test-id';

/**
 * Компонент фильтров KPI по месяцам.
 *
 * Page Object для работы с вкладками месяца и кнопкой выбора даты.
 * Поддерживает:
 * - проверку видимости компонента и вкладок;
 * - получение активной вкладки;
 * - выбор вкладки по индексу;
 * - проверку смены содержимого при переключении месяца.
 */
export class KpiMonthFiltersComponent extends UiObject {
  /** Корневой элемент фильтров по месяцам */
  readonly root: Locator;

  /** Все вкладки месяца */
  readonly tabs: Locator;

  /** Активная вкладка месяца */
  readonly activeTab: Locator;

  readonly testId: string;

  /**
   * @param page Экземпляр страницы Playwright
   */
  constructor(page: Page, testId: string = 'month-filters') {
    super(page);
    this.testId = requireTestId(testId, 'KpiMonthFiltersComponent');
    this.root = this.locate.testId(this.testId);
    const filters = this.locate.within(this.root);
    this.tabs = filters.role('tab');
    this.activeTab = filters.css(kpiTestIds.monthFilters.activeTabSelector);
  }

  /**
   * Проверяет видимость компонента и наличие хотя бы одной вкладки
   */
  async verifyVisible(): Promise<void> {
    await this.expectations.visible('KPI month filters', this.root);
    await this.expectations.nonEmpty('KPI month filter tabs', this.tabs);
  }

  /**
   * Проверяет, что активная вкладка одна и видима
   */
  async verifyActiveTab(): Promise<void> {
    await this.expectations.count('KPI active month filter', this.activeTab, 1);
    await this.expectations.visible('KPI active month filter', this.activeTab);
  }

  /**
   * Выбирает вкладку по индексу и проверяет, что она активна
   * @param index индекс вкладки
   */
  async selectTabByIndex(index: number): Promise<void> {
    const tab = this.tabs.nth(index);
    await this.actions.click(`KPI month filter: tab ${index}`, tab);
    await this.expectations.attribute(`KPI month filter: active tab ${index}`, tab, 'aria-selected', 'true');
  }

  /**
   * Проверяет, что при смене вкладки месяца изменилось содержимое основного блока
   * @param index индекс вкладки месяца
   * @param mainContent локатор основного блока, где меняется содержимое
   */
  async verifyMonthSwitchByIndex(index: number, mainContent: Locator): Promise<void> {
    const oldContent = await mainContent.textContent();
    await this.selectTabByIndex(index);
    await this.expectations.textChanged('KPI content after month switch', mainContent, oldContent);
  }
}
