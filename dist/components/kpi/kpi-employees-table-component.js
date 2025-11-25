"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiEmployeesTableComponent = void 0;
const test_1 = require("@playwright/test");
const employee_row_component_1 = require("./employee-row-component");
class KpiEmployeesTableComponent {
    root;
    rowsRoot;
    header;
    constructor(page) {
        this.root = page.locator('[data-testid="employees-table__main"]');
        this.rowsRoot = this.root.locator("tbody tr");
        this.header = this.root.locator("thead tr");
    }
    async verifyVisible() {
        await (0, test_1.expect)(this.root).toBeVisible();
        const rowCount = await this.getRowCount();
        const rows = await this.getRows();
        (0, test_1.expect)(rowCount).toBeGreaterThan(0);
        for (const row of rows) {
            await row.verify();
        }
    }
    async getRowCount() {
        return await this.rowsRoot.count();
    }
    async getRows() {
        const count = await this.getRowCount();
        const rows = [];
        for (let i = 0; i < count; i++) {
            rows.push(new employee_row_component_1.EmployeeRowComponent(this.root, i));
        }
        return rows;
    }
    async getHeaderCell(columnName) {
        const testIdMap = {
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
    async sortBy(columnName) {
        const cell = await this.getHeaderCell(columnName);
        await cell.click();
        await this.root.page().waitForTimeout(500);
        await this.waitForTableStable();
        await this.verifyTableDataValid();
    }
    async waitForTableStable() {
        let previousRowCount = -1;
        await (0, test_1.expect)(async () => {
            const currentRowCount = await this.getRowCount();
            if (previousRowCount === currentRowCount && currentRowCount > 0) {
                return true;
            }
            previousRowCount = currentRowCount;
            throw new Error('Table is still loading...');
        }).toPass({ timeout: 15000 });
    }
    async verifyTableDataValid() {
        const data = await this.getData();
        (0, test_1.expect)(data.length).toBeGreaterThan(0);
        for (const row of data) {
            (0, test_1.expect)(row.name).toBeTruthy();
            (0, test_1.expect)(row.score).toBeDefined();
            (0, test_1.expect)(row.mrr).toBeDefined();
        }
    }
    async getData() {
        const rows = await this.getRows();
        const data = [];
        for (const row of rows)
            data.push(await row.extractData());
        return data;
    }
    async assertSortedBy(column, direction) {
        const data = await this.getData();
        const values = data.map(d => d[column]);
        const numericColumns = ['rating', 'score', 'mrr', 'appsNumber'];
        const isNumericColumn = numericColumns.includes(column);
        for (let i = 0; i < values.length - 1; i++) {
            const current = values[i];
            const next = values[i + 1];
            if (isNumericColumn) {
                const currentNumber = Number(current);
                const nextNumber = Number(next);
                if (direction === "asc") {
                    (0, test_1.expect)(currentNumber).toBeLessThanOrEqual(nextNumber);
                }
                else {
                    (0, test_1.expect)(currentNumber).toBeGreaterThanOrEqual(nextNumber);
                }
                continue;
            }
            const currentString = String(current).toLowerCase();
            const nextString = String(next).toLowerCase();
            const comparison = currentString.localeCompare(nextString);
            if (direction === "asc") {
                (0, test_1.expect)(comparison).toBeLessThanOrEqual(0);
            }
            else {
                (0, test_1.expect)(comparison).toBeGreaterThanOrEqual(0);
            }
        }
    }
}
exports.KpiEmployeesTableComponent = KpiEmployeesTableComponent;
