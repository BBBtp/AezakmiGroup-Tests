import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { testUsers } from './users';
import { LoginPage } from '@modules/auth';
import { testSettings } from '@config/test-settings';

const AUTH_FILE = path.resolve('.auth/admin.json');
dotenv.config({ path: path.resolve('./.env') });
const BASE_URL = testSettings.baseUrl.replace(/\/+$/, '');

function appUrl(pathname: string): string {
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${BASE_URL}${normalizedPath}`;
}

/**
 * Выполняет повтор функции с экспоненциальной задержкой при ошибках
 * @param fn Функция, возвращающая промис
 * @param maxRetries Максимальное количество попыток
 * @param delay Задержка между попытками в мс
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 2000
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
    throw new Error('Max retries exceeded');
}

/**
 * Проверяет, что сохраненный storageState действительно авторизован:
 * - не попадает на страницу логина;
 * - видит корневой контейнер KPI.
 */
async function isAuthStateValid(): Promise<boolean> {
    if (!fs.existsSync(AUTH_FILE)) return false;

    const browser = await chromium.launch();
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();

    try {
        await page.goto(appUrl('/kpi'), {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        const currentUrl = page.url();
        const redirectedToAuth = /\/(login|auth|sign-in)/i.test(currentUrl);
        const hasLoginForm = await page.locator('[data-testid="login"], [data-testid="login__form"]').first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);
        const hasKpiRoot = await page.locator('[data-testid="kpi"]').first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);

        return !redirectedToAuth && !hasLoginForm && hasKpiRoot;
    } catch {
        return false;
    } finally {
        await browser.close();
    }
}

/**
 * Глобальная настройка Playwright
 * - Проверяет существующий файл авторизации;
 * - Если файл недействителен или отсутствует, выполняет UI login;
 * - Сохраняет состояние авторизации для последующих тестов.
 */
async function globalSetup() {
    if (await isAuthStateValid()) {
        return;
    }

    if (fs.existsSync(AUTH_FILE)) {
        fs.unlinkSync(AUTH_FILE);
    }

    await retryWithBackoff(async () => {
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        const loginPage = new LoginPage(page);

        try {
            await page.goto(appUrl('/login'), { waitUntil: 'domcontentloaded', timeout: 30000 });
            await loginPage.loginToGlobalSetup(testUsers.admin.email, testUsers.admin.password, { remember: true });
            await page.waitForURL(
                url => {
                    const value = url.toString();
                    return !/\/(login|auth|sign-in)/i.test(value);
                },
                { waitUntil: 'domcontentloaded', timeout: 60000 }
            );

            const stillOnLogin = /\/(login|auth|sign-in)/i.test(page.url());
            if (stillOnLogin) {
                throw new Error(`Global setup login failed: still on auth page (${page.url()})`);
            }

            fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
            await context.storageState({ path: AUTH_FILE });
            await browser.close();
        } catch (error) {
            await browser.close();
            throw error;
        }
    }, 3, 2000);
}

export default globalSetup;
