"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = void 0;
const test_1 = require("@playwright/test");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const kpi_page_1 = require("../pages/kpi/kpi-page");
const login_page_1 = require("../pages/auth/login-page");
const users_1 = require("./users");
exports.test = test_1.test.extend({
    // worker-scoped фикстура с объектом storageState
    workerStorageState: [async ({}, use) => {
            const fileName = path_1.default.resolve('.auth/admin.json');
            if (!fs_1.default.existsSync(fileName)) {
                throw new Error('Auth file not found! Make sure globalSetup ran successfully.');
            }
            const state = JSON.parse(fs_1.default.readFileSync(fileName, 'utf-8'));
            await use(state);
        }, { scope: 'worker' }],
    loginPage: async ({ page }, use) => {
        const loginPage = new login_page_1.LoginPage(page);
        await use(loginPage);
    },
    adminUser: async ({}, use) => {
        await use(users_1.testUsers.admin);
    },
    regularUser: async ({}, use) => {
        await use(users_1.testUsers.user);
    },
    kpiPage: async ({ browser, workerStorageState }, use) => {
        // Создаём context с валидным storageState, который включает cookies + localStorage
        const context = await browser.newContext({ storageState: workerStorageState });
        const page = await context.newPage();
        const kpiPageInstance = new kpi_page_1.KpiPage(page);
        await use(kpiPageInstance);
        // Закрываем context после теста
        await context.close();
    },
});
