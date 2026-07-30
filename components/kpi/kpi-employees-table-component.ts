import { type Locator, type Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiTestIds } from '@locators/kpi';
import { EmployeeRowComponent } from './employee-row-component';

/**
 * Структура данных сотрудника для KPI таблицы
 */
export interface EmployeeData {
  rating: number;
  name: string;
  letter: string;
  score: number;
  mrr: number;
  appsNumber: number;
  lastModified: string;
}

/**
 * Компонент таблицы KPI сотрудников.
 *
 * Page Object для работы с таблицей сотрудников.
 * Поддерживает:
 * - проверку видимости таблицы и строк;
 * - получение всех строк и данных;
 * - сортировку по столбцам;
 * - проверку валидности данных;
 * - ассерты на сортировку.
 */
export class KpiEmployeesTableComponent extends UiObject {
  /** Корневой элемент таблицы */
  readonly root: Locator;

  /** Локатор всех строк таблицы */
  readonly rowsRoot: Locator;

  /** Локатор заголовка таблицы */
  readonly header: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   */
  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(kpiTestIds.employeesTable.root);
    const table = this.locate.within(this.root);
    this.rowsRoot = table.css(kpiTestIds.employeesTable.rowsSelector);
    this.header = table.css(kpiTestIds.employeesTable.headerSelector);
  }

  /**
   * Проверяет, что таблица видима и содержит строки,
   * каждая строка проходит проверку видимости через EmployeeRowComponent
   */
  async verifyVisible(): Promise<void> {
    await this.expectations.visible('KPI employees table', this.root);
    await this.expectations.nonEmpty('KPI employee rows', this.rowsRoot);
    const rows = await this.getRows();
    for (const row of rows) {
      await row.verify();
    }
  }

  /** Возвращает количество строк в таблице */
  async getRowCount(): Promise<number> {
    return await this.rowsRoot.count();
  }

  /** Возвращает массив компонентов строк таблицы */
  async getRows(): Promise<EmployeeRowComponent[]> {
    const count = await this.getRowCount();
    const rows: EmployeeRowComponent[] = [];
    for (let i = 0; i < count; i++) {
      rows.push(new EmployeeRowComponent(this.root, i));
    }
    return rows;
  }

  async openFirstEmployee(): Promise<void> {
    const rows = await this.getRows();
    if (!rows.length) throw new Error('Employee table has no rows to open');
    await rows[0].open();
  }

  /**
   * Возвращает локатор ячейки заголовка по имени столбца
   * @param columnName название столбца
   */
  async getHeaderCell(columnName: string): Promise<Locator> {
    const testId =
      kpiTestIds.employeesTable.headers[columnName as keyof typeof kpiTestIds.employeesTable.headers];
    if (!testId) {
      throw new Error(`Unknown column: ${columnName}`);
    }

    return this.locate.within(this.header).testId(testId);
  }

  /**
   * Сортирует таблицу по указанному столбцу и проверяет корректность данных
   * @param columnName название столбца
   */
  async sortBy(columnName: string): Promise<void> {
    const cell = await this.getHeaderCell(columnName);
    await this.actions.click(`employees table: sort ${columnName}`, cell);
    await this.waitForTableStable();
    await this.verifyTableDataValid();
  }

  /**
   * Ожидает, что таблица стабилизировалась (не изменяет количество строк)
   */
  async waitForTableStable(): Promise<void> {
    let previousSnapshot = '';
    let stableReads = 0;

    await this.expectations.pollNumberAtLeast(
      'KPI employee rows become stable',
      this.rowsRoot,
      async () => {
        const rows = await this.rowsRoot.allTextContents();
        const snapshot = JSON.stringify(rows);
        stableReads = snapshot === previousSnapshot && rows.length > 0 ? stableReads + 1 : 0;
        previousSnapshot = snapshot;
        return stableReads;
      },
      1,
      {
        timeout: 15000,
        intervals: [100, 200, 400],
      },
    );
  }

  /**
   * Проверяет валидность данных таблицы
   */
  async verifyTableDataValid(): Promise<void> {
    const data = await this.getData();
    if (data.length === 0) {
      throw new Error('KPI employees table must contain data');
    }
    for (const row of data) {
      if (!row.name || !Number.isFinite(row.score) || !Number.isFinite(row.mrr)) {
        throw new Error(`Invalid KPI employee row: ${JSON.stringify(row)}`);
      }
    }
  }

  /** Извлекает все данные таблицы в массив EmployeeData */
  async getData(): Promise<EmployeeData[]> {
    const rows = await this.getRows();
    const data: EmployeeData[] = [];
    for (const row of rows) data.push(await row.extractData());
    return data;
  }

  /**
   * Ассерт на сортировку таблицы по указанному столбцу
   * @param column ключ EmployeeData
   * @param direction "asc" | "desc"
   */
  async assertSortedBy(column: keyof EmployeeData, direction: 'asc' | 'desc'): Promise<void> {
    const data = await this.getData();
    const values = data.map((d) => d[column]);
    const numericColumns: Array<keyof EmployeeData> = ['rating', 'score', 'mrr', 'appsNumber'];
    const isNumericColumn = numericColumns.includes(column);

    for (let i = 0; i < values.length - 1; i++) {
      const current = values[i];
      const next = values[i + 1];

      if (isNumericColumn) {
        const currentNumber = Number(current);
        const nextNumber = Number(next);
        const correctlySorted =
          direction === 'asc' ? currentNumber <= nextNumber : currentNumber >= nextNumber;
        if (!correctlySorted) {
          throw new Error(
            `KPI employees ${String(column)} is not sorted ${direction}: ${currentNumber}, ${nextNumber}`,
          );
        }
        continue;
      }

      const currentString = String(current).toLowerCase();
      const nextString = String(next).toLowerCase();
      const comparison = currentString.localeCompare(nextString);

      const correctlySorted = direction === 'asc' ? comparison <= 0 : comparison >= 0;
      if (!correctlySorted) {
        throw new Error(
          `KPI employees ${String(column)} is not sorted ${direction}: "${currentString}", "${nextString}"`,
        );
      }
    }
  }
}
