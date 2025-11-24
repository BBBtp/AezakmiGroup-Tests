import { test as baseTest } from '@playwright/test';
import type { BrowserContextOptions } from '@playwright/test';

type StorageState = NonNullable<BrowserContextOptions['storageState']>;
import fs from 'fs';
import path from 'path';
import { KpiPage } from '../pages/kpi/kpi-page';
import { LoginPage } from '../pages/auth/login-page';
import { testUsers } from './users';

export type TestFixtures = {
    loginPage: LoginPage;
    adminUser: typeof testUsers.admin;
    regularUser: typeof testUsers.user;
    kpiPage: KpiPage;
};

export const test = baseTest.extend<TestFixtures, { workerStorageState: any }>({
    // worker-scoped фикстура с объектом storageState
    workerStorageState: [async ({}, use: (state: StorageState) => Promise<void>) => {
        const fileName = path.resolve('.auth/admin.json');

        if (!fs.existsSync(fileName)) {
            throw new Error('Auth file not found! Make sure globalSetup ran successfully.');
        }

        const state: StorageState = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
        await use(state);
    }, { scope: 'worker' }],

    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },

    adminUser: async ({}, use) => {
        await use(testUsers.admin);
    },

    regularUser: async ({}, use) => {
        await use(testUsers.user);
    },

    kpiPage: async ({ browser, workerStorageState }, use) => {
        // Создаём context с валидным storageState, который включает cookies + localStorage
        const context = await browser.newContext({ storageState: workerStorageState });
        const page = await context.newPage();

        const kpiPageInstance = new KpiPage(page);

        await use(kpiPageInstance);

        // Закрываем context после теста
        await context.close();
    },
});
