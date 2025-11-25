"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const users_1 = require("./users");
const login_page_1 = require("../pages/auth/login-page");
const AUTH_FILE = path_1.default.resolve('.auth/admin.json');
const BASE_URL = 'https://totally-adequate-goldfinch.cloudpub.ru';
dotenv_1.default.config({ path: path_1.default.resolve('./.env') });
async function globalSetup() {
    // Если файл уже существует, проверяем валидность
    if (fs_1.default.existsSync(AUTH_FILE)) {
        const browser = await test_1.chromium.launch();
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
        fs_1.default.unlinkSync(AUTH_FILE);
    }
    console.log('Creating new auth storage via UI login...');
    const browser = await test_1.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new login_page_1.LoginPage(page);
    // Логин через UI
    await page.goto(`${BASE_URL}/login`);
    await loginPage.login(users_1.testUsers.admin.email, users_1.testUsers.admin.password, { remember: true });
    // Ждём успешного перехода на защищённую страницу
    await page.waitForURL(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    // Сохраняем storageState (cookies + localStorage)
    fs_1.default.mkdirSync(path_1.default.dirname(AUTH_FILE), { recursive: true });
    await context.storageState({ path: AUTH_FILE });
    console.log('Auth storage saved successfully');
    await browser.close();
}
exports.default = globalSetup;
