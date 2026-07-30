import { Locator } from '@playwright/test';
import { LocatorFactory, UiExpectations } from '@framework/ui';
import { kpiTestIds } from '@locators/kpi';

/**
 * Компонент элемента подиума (Podium Item) в блоке Top Employees.
 *
 * Page Object для работы с отдельной карточкой на подиуме.
 * Поддерживает:
 * - проверку видимости корневого элемента;
 * - проверку имени и валютного значения;
 * - проверку, что валютное значение не пустое.
 */
export class PodiumItemComponent {
  /** Корневой элемент подиума */
  readonly root: Locator;

  /** Имя сотрудника на подиуме */
  readonly name: Locator;

  /** Валютное значение сотрудника на подиуме */
  readonly currency: Locator;
  private readonly expectations: UiExpectations;

  /**
   * @param root Корневой локатор контейнера подиума
   * @param index Индекс элемента подиума (0, 1 или 2)
   */
  constructor(root: Locator, index: number) {
    const podium = new LocatorFactory(root);
    const testIds = kpiTestIds.topEmployees.podiumItem(index);
    this.expectations = new UiExpectations(root.page());
    this.root = podium.testId(testIds.root);
    const item = podium.within(this.root);
    this.name = item.testId(testIds.name);
    this.currency = item.css(testIds.currencySelector);
  }

  /**
   * Проверяет видимость всех ключевых элементов и что значение валюты не пустое
   */
  async verify(): Promise<void> {
    await this.expectations.visible('KPI podium item', this.root);
    await this.expectations.visible('KPI podium employee name', this.name);
    await this.expectations.visible('KPI podium currency', this.currency);

    const text = await this.currency.textContent();
    if (!text?.trim()) {
      throw new Error('KPI podium currency must not be empty');
    }
  }
}
