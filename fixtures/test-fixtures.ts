import { test as baseTest } from '@playwright/test';
import type { Browser, BrowserContextOptions, Page, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LoginPage } from '@modules/auth';
import { KpiPage, KpiSettingsPage } from '@modules/kpi';
import { testUsers } from './users';

const AUTH_FILE = path.resolve('.auth/admin.json');

const contextOptionKeys = [
    'acceptDownloads',
    'baseURL',
    'bypassCSP',
    'colorScheme',
    'deviceScaleFactor',
    'extraHTTPHeaders',
    'forcedColors',
    'geolocation',
    'hasTouch',
    'httpCredentials',
    'ignoreHTTPSErrors',
    'isMobile',
    'javaScriptEnabled',
    'locale',
    'offline',
    'permissions',
    'proxy',
    'reducedMotion',
    'screen',
    'serviceWorkers',
    'timezoneId',
    'userAgent',
    'viewport',
] as const;

function ensureAuthFileExists(): void {
    if (!fs.existsSync(AUTH_FILE)) {
        throw new Error('Auth file not found! Make sure globalSetup ran successfully.');
    }
}

function getProjectContextOptions(testInfo: TestInfo): BrowserContextOptions {
    const projectUse = testInfo.project.use as Record<string, unknown>;
    const contextOptions: BrowserContextOptions = {};

    for (const key of contextOptionKeys) {
        if (projectUse[key] !== undefined) {
            (contextOptions as Record<string, unknown>)[key] = projectUse[key];
        }
    }

    return contextOptions;
}

async function createAuthenticatedPage(
    browser: Browser,
    testInfo: TestInfo
): Promise<{ page: Page; close: () => Promise<void> }> {
    ensureAuthFileExists();

    const context = await browser.newContext({
        ...getProjectContextOptions(testInfo),
        storageState: AUTH_FILE,
    });
    const page = await context.newPage();

    return {
        page,
        close: () => context.close(),
    };
}

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

    /** KPI Settings страница */
    kpiSettingsPage: KpiSettingsPage;
};

/**
 * Кастомный test с фикстурами:
 * - loginPage
 * - adminUser
 * - regularUser
 * - kpiPage
 * - kpiSettingsPage
 */
export const test = baseTest.extend<TestFixtures>({
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
    kpiPage: async ({ browser }, use, testInfo) => {
        const { page, close } = await createAuthenticatedPage(browser, testInfo);
        const kpiPageInstance = new KpiPage(page);
        await use(kpiPageInstance);
        await close();
    },

    /**
     * Фикстура KPI Settings страницы с использованием сохраненного storageState
     */
    kpiSettingsPage: async ({ browser }, use, testInfo) => {
        const { page, close } = await createAuthenticatedPage(browser, testInfo);
        const kpiSettingsPageInstance = new KpiSettingsPage(page);
        await use(kpiSettingsPageInstance);
        await close();
    },
});
