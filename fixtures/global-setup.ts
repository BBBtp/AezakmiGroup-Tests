import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { testUsers } from './users';
import { LoginPage } from '../pages/auth/login-page';

const AUTH_FILE = path.resolve('.auth/admin.json');
const BASE_URL = 'https://excitedly-exciting-mutt.cloudpub.ru';
dotenv.config({ path: path.resolve('./.env') });

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
 * Глобальная настройка Playwright
 * - Проверяет существующий файл авторизации;
 * - Если файл недействителен или отсутствует, выполняет UI login;
 * - Сохраняет состояние авторизации для последующих тестов.
 */
async function globalSetup() {
    if (fs.existsSync(AUTH_FILE)) {
        const browser = await chromium.launch();
        const context = await browser.newContext({ storageState: AUTH_FILE });
        const page = await context.newPage();

        try {
            await page.goto(`${BASE_URL}/kpi`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            const url = page.url();
            if (!url.includes('/login')) {
                await browser.close();
                return;
            }
        } catch {
        }

        await browser.close();
        fs.unlinkSync(AUTH_FILE);
    }

    await retryWithBackoff(async () => {
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        const loginPage = new LoginPage(page);

        try {
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await loginPage.loginToGlobalSetup(testUsers.admin.email, testUsers.admin.password, { remember: true });
            await page.waitForURL(`${BASE_URL}/dashboard`, { waitUntil: 'commit', timeout: 60000 });

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
