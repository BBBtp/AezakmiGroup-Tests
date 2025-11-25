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
    (0, test_fixtures_1.test)('Подзаголовок отображается корректно', async ({ kpiPage }) => {
        await (0, test_1.expect)(kpiPage.subtitle).toBeVisible();
        await (0, test_1.expect)(kpiPage.subtitle).toHaveText(test_data_1.default.texts.kpi.basePage.title);
    });
    (0, test_fixtures_1.test)('Кнопка настроек отображается и кликабельна', async ({ kpiPage, page }) => {
        const btn = kpiPage.settingsButton;
        await (0, test_1.expect)(btn).toBeVisible();
        const errors = [];
        page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
        await btn.click();
        await kpiPage.page.waitForURL(/\/kpi\/settings/);
        (0, test_1.expect)(errors.length).toBe(0);
    });
    (0, test_fixtures_1.test)('Основной контент рендерится, error-content скрыт', async ({ kpiPage }) => {
        await (0, test_1.expect)(kpiPage.mainContent).toBeVisible();
        await (0, test_1.expect)(kpiPage.errorContent).toBeHidden();
    });
    (0, test_fixtures_1.test)('При ошибке загрузки отображается error-content, main-content скрыт', async ({ kpiPage }) => {
        await kpiPage.page.route('**/api/v1/kpi/managers/statistics*', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Mocked server error' }),
            });
        });
        await kpiPage.page.goto('/kpi');
        await kpiPage.page.waitForLoadState('networkidle');
        await (0, test_1.expect)(kpiPage.errorContent).toBeVisible();
        await (0, test_1.expect)(kpiPage.mainContent).toBeHidden();
    });
    (0, test_fixtures_1.test)('Проверка отображения карточек KPI', async ({ kpiPage }) => {
        const { mrrCard, scoreCard, appsCard } = kpiPage.cards;
        await test_fixtures_1.test.step('Проверяем карточку Total MRR', async () => {
            await mrrCard.assertVisible(test_data_1.default.texts.kpi.basePage.cardMrrTitle);
        });
        await test_fixtures_1.test.step('Проверяем карточку Average Score', async () => {
            await scoreCard.assertVisible(test_data_1.default.texts.kpi.basePage.cardScoreTitle);
        });
        await test_fixtures_1.test.step('Проверяем карточку Number of Apps', async () => {
            await appsCard.assertVisible(test_data_1.default.texts.kpi.basePage.cardAppsTitle);
        });
    });
    (0, test_fixtures_1.test)('Фильтры по месяцам видимы и работают', async ({ kpiPage }) => {
        const filters = kpiPage.filters;
        const mainContent = kpiPage.mainContent;
        await test_fixtures_1.test.step('Проверяем видимость фильтров по месяцам', async () => {
            await filters.verifyVisible();
        });
        await test_fixtures_1.test.step('Есть хотя бы один таб', async () => {
            const count = await filters.tabs.count();
            (0, test_1.expect)(count).toBeGreaterThan(0);
        });
        await test_fixtures_1.test.step('Активный таб отображается', async () => {
            await (0, test_1.expect)(filters.activeTab).toBeVisible();
        });
    });
    (0, test_fixtures_1.test)('График производительности отображается и табы переключаются', async ({ kpiPage, page }) => {
        const chart = kpiPage.chart;
        await chart.verifyVisible();
        const errors = [];
        page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
        await chart.mrrTab.click();
        (0, test_1.expect)(errors.length).toBe(0);
        await chart.scoreTab.click();
        (0, test_1.expect)(errors.length).toBe(0);
    });
    (0, test_fixtures_1.test)('Top Employees отображается', async ({ kpiPage }) => {
        const top = kpiPage.topEmployees;
        await (0, test_1.expect)(top.root).toBeVisible();
        await (0, test_1.expect)(top.title).toBeVisible();
        await test_fixtures_1.test.step('Podium рендерится', async () => {
            await (0, test_1.expect)(top.podium).toBeVisible();
        });
        await test_fixtures_1.test.step('Есть хотя бы один contender', async () => {
            const count = await top.getContendersCount();
            (0, test_1.expect)(count).toBeGreaterThan(0);
        });
    });
    (0, test_fixtures_1.test)('Таблица сотрудников отображается и можно открыть карточку сотрудника', async ({ kpiPage }) => {
        const table = kpiPage.employeesTable;
        await test_fixtures_1.test.step('Таблица отображается', async () => {
            await (0, test_1.expect)(table.root).toBeVisible();
        });
        await test_fixtures_1.test.step('Есть хотя бы одна строка', async () => {
            const count = await table.getRowCount();
            (0, test_1.expect)(count).toBeGreaterThan(0);
        });
        await test_fixtures_1.test.step('Кнопка Open открывает страницу сотрудника', async () => {
            const rows = await table.getRows();
            const firstRow = rows[0];
            const oldUrl = kpiPage.page.url();
            await Promise.all([
                kpiPage.page.waitForURL(/\/kpi\/.+/),
                firstRow.openButton.click()
            ]);
            await (0, test_1.expect)(kpiPage.page).toHaveURL(/\/kpi\/.+/);
            (0, test_1.expect)(kpiPage.page.url()).not.toBe(oldUrl);
        });
    });
});
