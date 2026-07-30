import { Locator } from '@playwright/test';
import { LocatorFactory, UiExpectations } from '@framework/ui';
import { kpiTestIds } from '@locators/kpi';

/**
 * Компонент элемента участника (Contender Item) в списке.
 *
 * Page Object для работы с карточкой участника.
 * Поддерживает:
 * - отображение имени участника;
 * - отображение валютного значения;
 * - проверку аватарки (инициалов) участника;
 * - проверку видимости всех ключевых элементов.
 */
export class ContenderItemComponent {
  /** Корневой элемент участника */
  readonly root: Locator;

  /** Имя участника */
  readonly name: Locator;

  /** Валютное значение участника */
  readonly currency: Locator;

  /** Аватар с инициалами участника */
  readonly avatarLetter: Locator;
  private readonly expectations: UiExpectations;

  /**
   * @param root Корневой локатор контейнера списка участников
   * @param index Индекс участника в списке (для формирования data-testid)
   */
  constructor(root: Locator, index: number) {
    const list = new LocatorFactory(root);
    const testIds = kpiTestIds.topEmployees.contenderItem(index);
    this.expectations = new UiExpectations(root.page());
    this.root = list.testId(testIds.root);
    const contender = list.within(this.root);
    this.name = contender.testId(testIds.name);
    this.currency = contender.css(testIds.currencySelector);
    this.avatarLetter = contender.css(testIds.avatarSelector).first();
  }

  /**
   * Проверяет корректность отображения элемента участника.
   *
   * Проверяет:
   * - видимость всех ключевых элементов (root, name, currency, avatar);
   * - корректность инициалов на аватаре (должны совпадать с первой и второй буквой имени).
   */
  async verify(): Promise<void> {
    await this.expectations.visible('KPI contender', this.root);
    await this.expectations.visible('KPI contender name', this.name);
    await this.expectations.visible('KPI contender currency', this.currency);
    await this.expectations.visible('KPI contender avatar', this.avatarLetter);

    const nameText = (await this.name.textContent())?.trim() || '';
    const avatarText = (await this.avatarLetter.textContent())?.trim() || '';
    const words = nameText.split(/\s+/);

    // Ожидаемые инициалы: первая буква имени + первая буква фамилии
    const expectedInitials = (words[0]?.charAt(0) || '') + (words[1]?.charAt(0) || '');

    if (avatarText.toUpperCase() !== expectedInitials.toUpperCase()) {
      throw new Error(
        `Contender avatar "${avatarText}" does not match expected initials "${expectedInitials}"`,
      );
    }
  }
}
