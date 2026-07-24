import { test } from '@fixtures';
import { chromium, expect } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { LoginPage } from '@modules/auth';
import { testSettings } from '@config/test-settings';
import { allure } from 'allure-playwright';
import { loggedClick } from '@utils/playwright-logger';
test.describe('Функциональность авторизации', () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.navigate();
    });

    test('Работа модального окна восстановления пароля', async ({ loginPage }) => {
        await allure.allureId('795');
        await loginPage.openForgotPasswordModal();
        await expect(loginPage.forgotPasswordModal.modal).toBeVisible();
        await expect(loginPage.forgotPasswordModal.telegramButton).toBeVisible();
        await loginPage.forgotPasswordModal.closeByButton();
        await expect(loginPage.forgotPasswordModal.modal).toBeHidden();
    });

    test('Закрытие модалки через оверлей', async ({ loginPage }) => {
        await allure.allureId('796');
        await loginPage.openForgotPasswordModal();
        await expect(loginPage.forgotPasswordModal.modal).toBeVisible();
        await loginPage.forgotPasswordModal.closeByOverlay();
        await expect(loginPage.forgotPasswordModal.modal).toBeHidden();
    });

    test('Кнопка "Remember me" работает (UI)', async ({ loginPage, adminUser }) => {
        await allure.allureId('797');
        const initialState = await loginPage.loginForm.isRememberMeChecked();
        expect(initialState).toBe(false);
        await loginPage.loginForm.toggleRememberMe();
        const newState = await loginPage.loginForm.isRememberMeChecked();
        expect(newState).toBe(true);
        await loginPage.loginForm.toggleRememberMe();
        const finalState = await loginPage.loginForm.isRememberMeChecked();
        expect(finalState).toBe(false);
    });

    test('Кнопка "Remember me" сохраняет сессию между перезапусками браузерного контекста', async ({ adminUser }) => {
        await allure.allureId('798');
        const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-remember-me-'));
        const contextOptions = {
            baseURL: testSettings.baseUrl,
            viewport: { width: 1280, height: 720 },
        };

        let context: BrowserContext | undefined;

        try {
            context = await chromium.launchPersistentContext(userDataDir, contextOptions);
            const page = context.pages()[0] ?? await context.newPage();
            const loginPage = new LoginPage(page);

            await loginPage.navigate();
            await loginPage.login(adminUser.email, adminUser.password, { remember: true });
            await expect(page).toHaveURL(/dashboard/);
            await context.close();

            context = await chromium.launchPersistentContext(userDataDir, contextOptions);
            const pageAfterRestart = context.pages()[0] ?? await context.newPage();
            await pageAfterRestart.goto('/dashboard');
            await expect(pageAfterRestart).toHaveURL(/dashboard/);
        } finally {
            if (context) {
                await context.close();
            }
            fs.rmSync(userDataDir, { recursive: true, force: true });
        }
    });

    test('Кнопка показа/скрытия пароля работает корректно', async ({ loginPage }) => {
        await allure.allureId('799');
        await expect(loginPage.loginForm.passwordInput).toHaveAttribute('type', 'password');
        await loggedClick(loginPage.page, 'login: show password', loginPage.loginForm.toggleButtonPasswordVisibility);
        await expect(loginPage.loginForm.passwordInput).toHaveAttribute('type', 'text');
        await loggedClick(loginPage.page, 'login: hide password', loginPage.loginForm.toggleButtonPasswordVisibility);
        await expect(loginPage.loginForm.passwordInput).toHaveAttribute('type', 'password')
    });

    test('Переход по Telegram ссылке', async ({ loginPage }) => {
        await allure.allureId('800');
        await loginPage.openForgotPasswordModal();
        const telegramHref = await loginPage.forgotPasswordModal.getTelegramButtonHref();
        expect(telegramHref).toBeTruthy();
        expect(telegramHref).toMatch(/t\.me|telegram/i);
    });

    test('Поля сохраняют значения после неуспешной попытки', async ({ loginPage, adminUser }) => {
        await allure.allureId('801');
        await loginPage.login(adminUser.email, 'wrongpassword');
        const emailValue = await loginPage.loginForm.getEmailValue();
        const passwordValue = await loginPage.loginForm.getPasswordValue();
        expect(emailValue).toBe(adminUser.email);
        expect(passwordValue).toBe('wrongpassword');
    });
});
