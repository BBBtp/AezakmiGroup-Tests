"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_fixtures_1 = require("../../fixtures/test-fixtures");
const test_data_1 = __importDefault(require("../../fixtures/test-data"));
const test_1 = require("@playwright/test");
test_fixtures_1.test.describe('Страница KPI', () => {
    test_fixtures_1.test.beforeEach(async ({ kpiPage }) => {
        await kpiPage.navigate();
    });
    (0, test_fixtures_1.test)('Фильтры: отображение, активный таб, переключение и изменение контента', async ({ kpiPage }) => {
        const filters = kpiPage.filters;
        const mainContent = kpiPage.mainContent;
        await test_fixtures_1.test.step('Фильтры отображаются', async () => {
            await filters.verifyVisible();
        });
        await test_fixtures_1.test.step('Активный таб корректен', async () => {
            await filters.verifyActiveTab();
        });
        await test_fixtures_1.test.step('Переключение месяца обновляет контент', async () => {
            await filters.verifyMonthSwitchByIndex(1, mainContent);
        });
    });
    (0, test_fixtures_1.test)('Top Employees: подиум отображается полностью и корректно', async ({ kpiPage }) => {
        const top = kpiPage.topEmployees;
        await test_fixtures_1.test.step('Блок отображается', async () => {
            await top.verifyVisible(test_data_1.default.texts.kpi.basePage.topEmpTitle);
        });
        await test_fixtures_1.test.step('Проверяем полный подиум (3 позиции)', async () => {
            await top.verifyPodium();
        });
    });
    (0, test_fixtures_1.test)('Top Employees: претенденты корректны и инициалы совпадают', async ({ kpiPage }) => {
        const top = kpiPage.topEmployees;
        const contendersCount = await top.getContendersCount();
        await test_fixtures_1.test.step(`Проверяем отображение претендентов ${contendersCount} `, async () => {
            await top.verifyContenders();
        });
    });
    (0, test_fixtures_1.test)('Карточки KPI отображаются и содержат значения', async ({ kpiPage }) => {
        const { mrrCard, scoreCard, appsCard } = kpiPage.cards;
        await test_fixtures_1.test.step('Total MRR', async () => {
            await mrrCard.assertVisible(test_data_1.default.texts.kpi.basePage.cardMrrTitle);
        });
        await test_fixtures_1.test.step('Average Score', async () => {
            await scoreCard.assertVisible(test_data_1.default.texts.kpi.basePage.cardScoreTitle);
        });
        await test_fixtures_1.test.step('Number of Apps', async () => {
            await appsCard.assertVisible(test_data_1.default.texts.kpi.basePage.cardAppsTitle);
        });
    });
    (0, test_fixtures_1.test)('График отображается, табы переключаются без ошибок', async ({ kpiPage, page }) => {
        const chart = kpiPage.chart;
        await chart.verifyVisible();
        const errors = [];
        page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()));
        await chart.mrrTab.click();
        (0, test_1.expect)(errors).toHaveLength(0);
        await chart.scoreTab.click();
        (0, test_1.expect)(errors).toHaveLength(0);
    });
    (0, test_fixtures_1.test)('Таблица сотрудников: строки отображаются и корректны', async ({ kpiPage }) => {
        const table = kpiPage.employeesTable;
        await test_fixtures_1.test.step('Таблица отображается', async () => {
            await table.verifyVisible();
        });
    });
    (0, test_fixtures_1.test)('Таблица сотрудников: кнопка Open открывает страницу сотрудника', async ({ kpiPage }) => {
        const table = kpiPage.employeesTable;
        const rows = await table.getRows();
        (0, test_1.expect)(rows.length).toBeGreaterThan(0);
        const firstRow = rows[0];
        const baseUrl = kpiPage.page.url();
        await Promise.all([
            kpiPage.page.waitForURL(/\/kpi\/.+/),
            firstRow.openButton.click()
        ]);
        const newUrl = kpiPage.page.url();
        (0, test_1.expect)(newUrl).not.toBe(baseUrl);
    });
    (0, test_fixtures_1.test)('Таблица сотрудников: сортировка по колонкам', async ({ kpiPage }) => {
        const table = kpiPage.employeesTable;
        await test_fixtures_1.test.step('Sort by Score', async () => {
            await table.assertSortedBy('score', 'desc');
            await table.sortBy('Score');
            await table.assertSortedBy('score', 'desc');
            await table.sortBy('Score');
            await table.assertSortedBy('score', 'asc');
            await table.sortBy('Score');
        });
        await test_fixtures_1.test.step('Sort by MRR', async () => {
            await table.sortBy('MRR');
            await table.assertSortedBy('mrr', 'desc');
            await table.sortBy('MRR');
            await table.assertSortedBy('mrr', 'asc');
            await table.sortBy('MRR');
        });
    });
});
