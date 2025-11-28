import { test } from '../../fixtures/test-fixtures';
import testData from "../../fixtures/test-data";
import {expect} from "@playwright/test";

test.describe('Страница KPI', () => {
    test.beforeEach(async ({ kpiPage }) => {
        await kpiPage.navigate();
    });

    test('Подзаголовок отображается корректно', async ({ kpiPage }) => {
        await expect(kpiPage.subtitle).toBeVisible();
        await expect(kpiPage.subtitle).toHaveText(testData.texts.kpi.basePage.title);
    });

    test('Кнопка настроек отображается и кликабельна', async ({ kpiPage, page }) => {
        const btn = kpiPage.settingsButton;
        await expect(btn).toBeVisible();
        const errors: string[] = [];
        page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
        await btn.click();
        await kpiPage.page.waitForURL(/\/kpi\/settings/);
        expect(errors.length).toBe(0);
    });

    test('Основной контент рендерится, error-content скрыт', async ({ kpiPage }) => {
        await expect(kpiPage.mainContent).toBeVisible();
        await expect(kpiPage.errorContent).toBeHidden();
    });

    test('При ошибке загрузки отображается error-content, main-content скрыт', async ({ kpiPage }) => {
        await kpiPage.page.route('**/api/v1/kpi/managers/statistics*', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Mocked server error' }),
            });
        });

        await kpiPage.page.goto('/kpi');
        await kpiPage.page.waitForLoadState('networkidle');
        await expect(kpiPage.errorContent).toBeVisible();
        await expect(kpiPage.mainContent).toBeHidden();
    });

    test('Проверка отображения карточек KPI', async ({ kpiPage }) => {
        const { mrrCard, scoreCard, appsCard } = kpiPage.cards;

        await test.step('Проверяем карточку Total MRR', async () => {
            await mrrCard.assertVisible(testData.texts.kpi.basePage.cardMrrTitle);
        });
        await test.step('Проверяем карточку Average Score', async () => {
            await scoreCard.assertVisible(testData.texts.kpi.basePage.cardScoreTitle);
        });
        await test.step('Проверяем карточку Number of Apps', async () => {
            await appsCard.assertVisible(testData.texts.kpi.basePage.cardAppsTitle);
        });
    });

    test('Фильтры по месяцам видимы и работают', async ({ kpiPage }) => {
        const filters = kpiPage.filters;
        const mainContent = kpiPage.mainContent;

        await test.step('Проверяем видимость фильтров по месяцам', async () => {
            await filters.verifyVisible();
        });
        await test.step('Есть хотя бы один таб', async () => {
            const count = await filters.tabs.count();
            expect(count).toBeGreaterThan(0);
        });
        await test.step('Активный таб отображается', async () => {
            await expect(filters.activeTab).toBeVisible();
        });
    });

    test('График производительности отображается и табы переключаются', async ({ kpiPage, page }) => {
        const chart = kpiPage.chart;
        await chart.verifyVisible();

        const errors: string[] = [];
        page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
        await chart.mrrTab.click();
        expect(errors.length).toBe(0);
        await chart.scoreTab.click();
        expect(errors.length).toBe(0);
    });

    test('Top Employees отображается', async ({ kpiPage }) => {
        const top = kpiPage.topEmployees;

        await expect(top.root).toBeVisible();
        await expect(top.title).toBeVisible();
        await test.step('Podium рендерится', async () => {
            await expect(top.podium).toBeVisible();
        });
        await test.step('Есть хотя бы один contender', async () => {
            const count = await top.getContendersCount();
            expect(count).toBeGreaterThan(0);
        });
    });


    test('Таблица сотрудников отображается и можно открыть карточку сотрудника', async ({ kpiPage }) => {
        const table = kpiPage.employeesTable;

        await test.step('Таблица отображается', async () => {
            await expect(table.root).toBeVisible();
        });
        await test.step('Есть хотя бы одна строка', async () => {
            const count = await table.getRowCount();
            expect(count).toBeGreaterThan(0);
        });
        await test.step('Кнопка Open открывает страницу сотрудника', async () => {
            const rows = await table.getRows();
            const firstRow = rows[0];
            const oldUrl = kpiPage.page.url();
            await Promise.all([
                kpiPage.page.waitForURL(/\/kpi\/.+/),
                firstRow.openButton.click()
            ]);
            await expect(kpiPage.page).toHaveURL(/\/kpi\/.+/);
            expect(kpiPage.page.url()).not.toBe(oldUrl);
        });
    });

});
