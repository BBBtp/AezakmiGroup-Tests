import { Locator, expect } from '@playwright/test';
import { UiObject } from '@framework/ui';
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
export class EmployeeRowComponent extends UiObject {
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
    super(root.page());
    const table = this.locate.within(root);
    this.row = table.css('tbody tr').nth(index);
    this.rating = table.testId(`employees-table__rating-${index}`);
    this.avatarLetter = table.css(`[data-testid="employees-table__avatar-${index}"] p`).first();
    this.name = table.testId(`employees-table__avatar-${index}-title`);
    this.sublink = table.testId(`employees-table__avatar-${index}-sublink`);
    this.score = table.testId(`employees-table__score-${index}`);
    this.mrr = table.testId(`employees-table__mrr-${index}`);
    this.appsNumber = table.testId(`employees-table__apps-number-${index}`);
    this.lastModified = table.testId(`employees-table__last-modified-${index}`);
    this.openButton = this.locate
      .within(this.row)
      .css('button:has-text("Open"), a:has-text("Open"), [role="button"]:has-text("Open")')
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

  async open(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/kpi\/.+/),
      this.actions.click('employees table: open employee', this.openButton),
    ]);
  }
}
