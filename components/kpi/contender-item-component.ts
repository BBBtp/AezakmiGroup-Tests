import { Locator, expect } from '@playwright/test';
import { LocatorFactory } from '@framework/ui';

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

  /**
   * @param root Корневой локатор контейнера списка участников
   * @param index Индекс участника в списке (для формирования data-testid)
   */
  constructor(root: Locator, index: number) {
    const list = new LocatorFactory(root);
    this.root = list.testId(`contender-${index}`);
    const contender = list.within(this.root);
    this.name = contender.testId(`contender-${index}__name`);
    this.currency = contender.css(`[data-testid="contender-${index}__currency"] p`);
    this.avatarLetter = contender.css(`[data-testid="contender-${index}-avatar"] p`).first();
  }

  /**
   * Проверяет корректность отображения элемента участника.
   *
   * Проверяет:
   * - видимость всех ключевых элементов (root, name, currency, avatar);
   * - корректность инициалов на аватаре (должны совпадать с первой и второй буквой имени).
   */
  async verify(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.name).toBeVisible();
    await expect(this.currency).toBeVisible();
    await expect(this.avatarLetter).toBeVisible();

    const nameText = (await this.name.textContent())?.trim() || '';
    const avatarText = (await this.avatarLetter.textContent())?.trim() || '';
    const words = nameText.split(/\s+/);

    // Ожидаемые инициалы: первая буква имени + первая буква фамилии
    const expectedInitials = (words[0]?.charAt(0) || '') + (words[1]?.charAt(0) || '');

    await expect(avatarText.toUpperCase()).toBe(expectedInitials.toUpperCase());
  }
}
