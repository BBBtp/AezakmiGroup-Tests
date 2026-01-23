import { expect, Locator, Page } from "@playwright/test";
import { EmployeeRowComponent } from "./employee-row-component";

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
export class KpiEmployeesTableComponent {
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
        this.root = page.locator('[data-testid="employees-table__main"]');
        this.rowsRoot = this.root.locator("tbody tr");
        this.header = this.root.locator("thead tr");
    }

    /**
     * Проверяет, что таблица видима и содержит строки,
     * каждая строка проходит проверку видимости через EmployeeRowComponent
     */
    async verifyVisible(): Promise<void> {
        await expect(this.root).toBeVisible();
        const rowCount = await this.getRowCount();
        const rows = await this.getRows();
        expect(rowCount).toBeGreaterThan(0);
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

    /**
     * Возвращает локатор ячейки заголовка по имени столбца
     * @param columnName название столбца
     */
    async getHeaderCell(columnName: string): Promise<Locator> {
        const testIdMap: { [key: string]: string } = {
            'Score': 'employees-table__header-score',
            'MRR': 'employees-table__header-mrr',
            'Rating': 'employees-table__header-rating',
            'Name': 'employees-table__header-name',
            'Number of apps': 'employees-table__header-numberOfApps',
            'Last modified': 'employees-table__header-lastModified'
        };
        const testId = testIdMap[columnName];
        if (!testId) {
            throw new Error(`Unknown column: ${columnName}`);
        }

        return this.header.locator(`[data-testid="${testId}"]`);
    }

    /**
     * Сортирует таблицу по указанному столбцу и проверяет корректность данных
     * @param columnName название столбца
     */
    async sortBy(columnName: string): Promise<void> {
        const cell = await this.getHeaderCell(columnName);
        await cell.click();
        await this.root.page().waitForTimeout(500);
        await this.waitForTableStable();
        await this.verifyTableDataValid();
    }

    /**
     * Ожидает, что таблица стабилизировалась (не изменяет количество строк)
     */
    async waitForTableStable(): Promise<void> {
        let previousRowCount = -1;
        await expect(async () => {
            const currentRowCount = await this.getRowCount();
            if (previousRowCount === currentRowCount && currentRowCount > 0) {
                return true;
            }
            previousRowCount = currentRowCount;
            throw new Error('Table is still loading...');
        }).toPass({ timeout: 15000 });
    }

    /**
     * Проверяет валидность данных таблицы
     */
    async verifyTableDataValid(): Promise<void> {
        const data = await this.getData();
        expect(data.length).toBeGreaterThan(0);
        for (const row of data) {
            expect(row.name).toBeTruthy();
            expect(row.score).toBeDefined();
            expect(row.mrr).toBeDefined();
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
    async assertSortedBy(column: keyof EmployeeData, direction: "asc" | "desc"): Promise<void> {
        const data = await this.getData();
        const values = data.map(d => d[column]);
        const numericColumns: Array<keyof EmployeeData> = ['rating', 'score', 'mrr', 'appsNumber'];
        const isNumericColumn = numericColumns.includes(column);

        for (let i = 0; i < values.length - 1; i++) {
            const current = values[i];
            const next = values[i + 1];

            if (isNumericColumn) {
                const currentNumber = Number(current);
                const nextNumber = Number(next);
                if (direction === "asc") {
                    expect(currentNumber).toBeLessThanOrEqual(nextNumber);
                } else {
                    expect(currentNumber).toBeGreaterThanOrEqual(nextNumber);
                }
                continue;
            }

            const currentString = String(current).toLowerCase();
            const nextString = String(next).toLowerCase();
            const comparison = currentString.localeCompare(nextString);

            if (direction === "asc") {
                expect(comparison).toBeLessThanOrEqual(0);
            } else {
                expect(comparison).toBeGreaterThanOrEqual(0);
            }
        }
    }
}
