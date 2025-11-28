import { test } from '../../fixtures/test-fixtures';
import testData from "../../fixtures/test-data";
import {expect} from "@playwright/test";

test.describe('Страница KPI', () => {

    test.beforeEach(async ({ kpiPage }) => {
        await kpiPage.navigate();
    });

    test('Фильтры: отображение, активный таб, переключение и изменение контента', async ({ kpiPage }) => {
        const filters = kpiPage.filters;
        const mainContent = kpiPage.mainContent;

        await test.step('Фильтры отображаются', async () => {
            await filters.verifyVisible();
        });

        await test.step('Активный таб корректен', async () => {
            await filters.verifyActiveTab();
        });

        await test.step('Переключение месяца обновляет контент', async () => {
            await filters.verifyMonthSwitchByIndex(1, mainContent);
        });
    });

    test('Top Employees: подиум отображается полностью и корректно', async ({ kpiPage }) => {
        const top = kpiPage.topEmployees;
        await test.step('Блок отображается', async () => {
            await top.verifyVisible(testData.texts.kpi.basePage.topEmpTitle);
        });
        await test.step('Проверяем полный подиум (3 позиции)', async () => {
            await top.verifyPodium();
        });

    });

    test('Top Employees: претенденты корректны и инициалы совпадают', async ({ kpiPage }) => {
        const top = kpiPage.topEmployees;
        const contendersCount = await top.getContendersCount();
        await test.step(`Проверяем отображение претендентов ${contendersCount} `, async () => {
            await top.verifyContenders();
        });
    });

    test('Карточки KPI отображаются и содержат значения', async ({ kpiPage }) => {
        const { mrrCard, scoreCard, appsCard } = kpiPage.cards;

        await test.step('Total MRR', async () => {
            await mrrCard.assertVisible(testData.texts.kpi.basePage.cardMrrTitle);
        });
        await test.step('Average Score', async () => {
            await scoreCard.assertVisible(testData.texts.kpi.basePage.cardScoreTitle);
        });
        await test.step('Number of Apps', async () => {
            await appsCard.assertVisible(testData.texts.kpi.basePage.cardAppsTitle);
        });
    });

    test('График отображается, табы переключаются без ошибок', async ({ kpiPage, page }) => {
        const chart = kpiPage.chart;

        await chart.verifyVisible();
        const errors: string[] = [];
        page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()));
        await chart.mrrTab.click();
        expect(errors).toHaveLength(0);
        await chart.scoreTab.click();
        expect(errors).toHaveLength(0);
    });

    test('Таблица сотрудников: строки отображаются и корректны', async ({ kpiPage }) => {
        const table = kpiPage.employeesTable;

        await test.step('Таблица отображается', async () => {
            await table.verifyVisible();
        });
    });

    test('Таблица сотрудников: кнопка Open открывает страницу сотрудника', async ({ kpiPage }) => {
        const table = kpiPage.employeesTable;

        const rows = await table.getRows();
        expect(rows.length).toBeGreaterThan(0);
        const firstRow = rows[0];
        const baseUrl = kpiPage.page.url();
        await Promise.all([
            kpiPage.page.waitForURL(/\/kpi\/.+/),
            firstRow.openButton.click()
        ]);
        const newUrl = kpiPage.page.url();
        expect(newUrl).not.toBe(baseUrl);
    });

    test('Таблица сотрудников: сортировка по колонкам', async ({ kpiPage }) => {
        const table = kpiPage.employeesTable;

        await test.step('Sort by Score', async () => {
            await table.assertSortedBy('score', 'desc');
            await table.sortBy('Score');
            await table.assertSortedBy('score', 'desc');
            await table.sortBy('Score');
            await table.assertSortedBy('score', 'asc');
            await table.sortBy('Score');
        });

        await test.step('Sort by MRR', async () => {
            await table.sortBy('MRR');
            await table.assertSortedBy('mrr', 'desc');
            await table.sortBy('MRR');
            await table.assertSortedBy('mrr', 'asc');
            await table.sortBy('MRR');
        });
    });

});
