import { Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiTestIds } from '@locators/kpi';
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
    const testIds = kpiTestIds.employeesTable.row(index);
    const table = this.locate.within(root);
    this.row = table.css(kpiTestIds.employeesTable.rowsSelector).nth(index);
    this.rating = table.testId(testIds.rating);
    this.avatarLetter = table.css(testIds.avatarSelector).first();
    this.name = table.testId(testIds.name);
    this.sublink = table.testId(testIds.sublink);
    this.score = table.testId(testIds.score);
    this.mrr = table.testId(testIds.mrr);
    this.appsNumber = table.testId(testIds.appsNumber);
    this.lastModified = table.testId(testIds.lastModified);
    this.openButton = this.locate.within(this.row).css(kpiTestIds.employeesTable.openActionSelector).first();
  }

  /**
   * Проверяет видимость всех ключевых элементов строки сотрудника
   */
  async verify(): Promise<void> {
    await this.expectations.visible('KPI employee rating', this.rating);
    await this.expectations.visible('KPI employee avatar', this.avatarLetter);
    await this.expectations.visible('KPI employee name', this.name);
    await this.expectations.visible('KPI employee score', this.score);
    await this.expectations.visible('KPI employee MRR', this.mrr);
    await this.expectations.visible('KPI employee applications', this.appsNumber);
    await this.expectations.visible('KPI employee last modified', this.lastModified);
    await this.expectations.visible('KPI employee open action', this.openButton);
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
    if (letter !== name.charAt(0)) {
      throw new Error(`Employee avatar "${letter}" does not match employee name "${name}"`);
    }
  }

  async open(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/kpi\/.+/),
      this.actions.click('employees table: open employee', this.openButton),
    ]);
  }
}
