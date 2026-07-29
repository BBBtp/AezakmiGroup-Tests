import { Locator, expect } from '@playwright/test';
import { EmployeeData } from './kpi-employees-table-component';
import { parseCurrency } from '../../utils/parser';

/**
 * Компонент строки таблицы сотрудников (Employee Row).
 *
 * Page Object для работы с отдельной строкой таблицы KPI сотрудников.
 * Поддерживает:
 * - проверку видимости всех ключевых элементов;
 * - извлечение данных в структуру EmployeeData;
 * - проверку соответствия аватара первой букве имени.
 */
export class EmployeeRowComponent {
  /** Корневой элемент конкретной строки */
  readonly row: Locator;
  /** Рейтинг сотрудника */
  readonly rating: Locator;

  /** Аватар сотрудника (первый символ) */
  readonly avatarLetter: Locator;

  /** Имя сотрудника */
  readonly name: Locator;

  /** Подссылка под именем (sublink) */
  readonly sublink: Locator;

  /** Баллы сотрудника (score) */
  readonly score: Locator;

  /** MRR сотрудника */
  readonly mrr: Locator;

  /** Количество приложений */
  readonly appsNumber: Locator;

  /** Дата последнего изменения */
  readonly lastModified: Locator;

  /** Кнопка открытия подробностей */
  readonly openButton: Locator;

  /**
   * @param root Корневой локатор таблицы сотрудников
   * @param index Индекс строки сотрудника (для формирования data-testid)
   */
  constructor(root: Locator, index: number) {
    this.row = root.locator('tbody tr').nth(index);
    this.rating = root.locator(`[data-testid="employees-table__rating-${index}"]`);
    this.avatarLetter = root.locator(`[data-testid="employees-table__avatar-${index}"] p`).first();
    this.name = root.locator(`[data-testid="employees-table__avatar-${index}-title"]`);
    this.sublink = root.locator(`[data-testid="employees-table__avatar-${index}-sublink"]`);
    this.score = root.locator(`[data-testid="employees-table__score-${index}"]`);
    this.mrr = root.locator(`[data-testid="employees-table__mrr-${index}"]`);
    this.appsNumber = root.locator(`[data-testid="employees-table__apps-number-${index}"]`);
    this.lastModified = root.locator(`[data-testid="employees-table__last-modified-${index}"]`);
    this.openButton = this.row
      .locator('button:has-text("Open"), a:has-text("Open"), [role="button"]:has-text("Open")')
      .first();
  }

  /**
   * Проверяет видимость всех ключевых элементов строки сотрудника
   */
  async verify(): Promise<void> {
    await expect(this.rating).toBeVisible();
    await expect(this.avatarLetter).toBeVisible();
    await expect(this.name).toBeVisible();
    await expect(this.score).toBeVisible();
    await expect(this.mrr).toBeVisible();
    await expect(this.appsNumber).toBeVisible();
    await expect(this.lastModified).toBeVisible();
    await expect(this.openButton).toBeVisible();
  }

  /**
   * Извлекает данные строки в объект EmployeeData
   *
   * @returns данные сотрудника
   */
  async extractData(): Promise<EmployeeData> {
    return {
      rating: Number(await this.rating.textContent()),
      name: (await this.name.textContent())?.trim() ?? '',
      letter: (await this.avatarLetter.textContent())?.trim() ?? '',
      score: Number(await this.score.textContent()),
      mrr: parseCurrency(await this.mrr.textContent()),
      appsNumber: Number(await this.appsNumber.textContent()),
      lastModified: (await this.lastModified.textContent())?.trim() ?? '',
    };
  }

  /**
   * Проверяет, что аватар соответствует первой букве имени сотрудника
   */
  async verifyAvatarMatchesName(): Promise<void> {
    const letter = (await this.avatarLetter.textContent())?.trim() ?? '';
    const name = (await this.name.textContent())?.trim() ?? '';
    await expect(letter).toBe(name.charAt(0));
  }
}
