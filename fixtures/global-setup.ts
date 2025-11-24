import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { testUsers } from './users';
import { LoginPage } from '../pages/auth/login-page';

const AUTH_FILE = path.resolve('.auth/admin.json');
const BASE_URL = 'https://totally-adequate-goldfinch.cloudpub.ru';

async function globalSetup() {
    // Если файл уже существует, проверяем валидность
    if (fs.existsSync(AUTH_FILE)) {
        const browser = await chromium.launch();
        const context = await browser.newContext({ storageState: AUTH_FILE });
        const page = await context.newPage();
        await page.goto(`${BASE_URL}/kpi`, { waitUntil: 'domcontentloaded' });

        // Проверка токена и редиректа
        const url = page.url();
        if (!url.includes('/login')) {
            console.log('Auth file is valid');
            await browser.close();
            return;
        }

        console.log('Auth file invalid, recreating...');
        await browser.close();
        fs.unlinkSync(AUTH_FILE);
    }

    console.log('Creating new auth storage via UI login...');

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    // Логин через UI
    await page.goto(`${BASE_URL}/login`);
    await loginPage.login(testUsers.admin.email, testUsers.admin.password, { remember: true });

    // Ждём успешного перехода на защищённую страницу
    await page.waitForURL(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });

    // Сохраняем storageState (cookies + localStorage)
    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
    await context.storageState({ path: AUTH_FILE });
    console.log('Auth storage saved successfully');

    await browser.close();
}

export default globalSetup;
