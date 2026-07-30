import { Locator, expect } from '@playwright/test';

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

  /**
   * @param root Корневой локатор контейнера подиума
   * @param index Индекс элемента подиума (0, 1 или 2)
   */
  constructor(root: Locator, index: number) {
    this.root = root.locator(`[data-testid="podium-${index}"]`);
    this.name = this.root.locator(`[data-testid="podium-${index}__name"]`);
    this.currency = this.root.locator(`[data-testid="podium-${index}__currency"] p`);
  }

  /**
   * Проверяет видимость всех ключевых элементов и что значение валюты не пустое
   */
  async verify(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.name).toBeVisible();
    await expect(this.currency).toBeVisible();

    const text = await this.currency.textContent();
    await expect(text?.trim().length).toBeGreaterThan(0);
  }
}
