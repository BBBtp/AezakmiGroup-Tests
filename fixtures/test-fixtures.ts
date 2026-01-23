import { test as baseTest } from '@playwright/test';
import type { BrowserContextOptions } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { KpiPage } from '../pages/kpi/kpi-page';
import { LoginPage } from '../pages/auth/login-page';
import { testUsers } from './users';

type StorageState = NonNullable<BrowserContextOptions['storageState']>;

/**
 * Типы кастомных фикстур для тестов
 */
export type TestFixtures = {
    /** Страница логина */
    loginPage: LoginPage;

    /** Админ-пользователь */
    adminUser: typeof testUsers.admin;

    /** Обычный пользователь */
    regularUser: typeof testUsers.user;

    /** KPI страница */
    kpiPage: KpiPage;
};

/**
 * Кастомный test с фикстурами:
 * - loginPage
 * - adminUser
 * - regularUser
 * - kpiPage
 * - workerStorageState (загружает storageState для всех воркеров)
 */
export const test = baseTest.extend<TestFixtures, { workerStorageState: any }>({
    /**
     * Загружает состояние авторизации для воркера
     */
    workerStorageState: [
        async ({}, use: (state: StorageState) => Promise<void>) => {
            const fileName = path.resolve('.auth/admin.json');

            if (!fs.existsSync(fileName)) {
                throw new Error('Auth file not found! Make sure globalSetup ran successfully.');
            }

            const state: StorageState = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
            await use(state);
        },
        { scope: 'worker' }
    ],

    /**
     * Фикстура страницы логина
     */
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },

    /**
     * Фикстура админ-пользователя
     */
    adminUser: async ({}, use) => {
        await use(testUsers.admin);
    },

    /**
     * Фикстура обычного пользователя
     */
    regularUser: async ({}, use) => {
        await use(testUsers.user);
    },

    /**
     * Фикстура KPI страницы с использованием сохраненного storageState
     */
    kpiPage: async ({ browser, workerStorageState }, use) => {
        const context = await browser.newContext({ storageState: workerStorageState });
        const page = await context.newPage();

        const kpiPageInstance = new KpiPage(page);
        await use(kpiPageInstance);
        await context.close();
    },
});
