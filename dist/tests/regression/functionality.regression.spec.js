"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_fixtures_1 = require("../../fixtures/test-fixtures");
const test_1 = require("@playwright/test");
test_fixtures_1.test.describe('Функциональность авторизации', () => {
    test_fixtures_1.test.beforeEach(async ({ loginPage }) => {
        await loginPage.navigate();
    });
    (0, test_fixtures_1.test)('Работа модального окна восстановления пароля', async ({ loginPage }) => {
        await loginPage.openForgotPasswordModal();
        await (0, test_1.expect)(loginPage.forgotPasswordModal.modal).toBeVisible();
        await (0, test_1.expect)(loginPage.forgotPasswordModal.telegramButton).toBeVisible();
        await loginPage.forgotPasswordModal.closeByButton();
        await (0, test_1.expect)(loginPage.forgotPasswordModal.modal).toBeHidden();
    });
    (0, test_fixtures_1.test)('Закрытие модалки через оверлей', async ({ loginPage }) => {
        await loginPage.openForgotPasswordModal();
        await (0, test_1.expect)(loginPage.forgotPasswordModal.modal).toBeVisible();
        await loginPage.forgotPasswordModal.closeByOverlay();
        await (0, test_1.expect)(loginPage.forgotPasswordModal.modal).toBeHidden();
    });
    (0, test_fixtures_1.test)('Кнопка "Remember me" работает (UI)', async ({ loginPage, adminUser }) => {
        const initialState = await loginPage.loginForm.isRememberMeChecked();
        (0, test_1.expect)(initialState).toBe(false);
        await loginPage.loginForm.toggleRememberMe();
        const newState = await loginPage.loginForm.isRememberMeChecked();
        (0, test_1.expect)(newState).toBe(true);
        await loginPage.loginForm.toggleRememberMe();
        const finalState = await loginPage.loginForm.isRememberMeChecked();
        (0, test_1.expect)(finalState).toBe(false);
    });
    (0, test_fixtures_1.test)('Кнопка "Remember me" работает (Functional)', async ({ browser, context, loginPage, adminUser }) => {
        await loginPage.loginForm.toggleRememberMe();
        await loginPage.login(adminUser.email, adminUser.password, { remember: true });
        const page2 = await context.newPage();
        await page2.goto('/dashboard');
        await (0, test_1.expect)(page2).toHaveURL(/dashboard/);
        await page2.close();
    });
    (0, test_fixtures_1.test)('Кнопка показа/скрытия пароля работает корректно', async ({ loginPage }) => {
        await (0, test_1.expect)(loginPage.loginForm.passwordInput).toHaveAttribute('type', 'password');
        await loginPage.loginForm.toggleButtonPasswordVisibility.click();
        await (0, test_1.expect)(loginPage.loginForm.passwordInput).toHaveAttribute('type', 'text');
        await loginPage.loginForm.toggleButtonPasswordVisibility.click();
        await (0, test_1.expect)(loginPage.loginForm.passwordInput).toHaveAttribute('type', 'password');
    });
    (0, test_fixtures_1.test)('Переход по Telegram ссылке', async ({ loginPage }) => {
        await loginPage.openForgotPasswordModal();
        const telegramHref = await loginPage.forgotPasswordModal.getTelegramButtonHref();
        (0, test_1.expect)(telegramHref).toBeTruthy();
        (0, test_1.expect)(telegramHref).toMatch(/t\.me|telegram/i);
    });
    (0, test_fixtures_1.test)('Поля сохраняют значения после неуспешной попытки', async ({ loginPage, adminUser }) => {
        await loginPage.login(adminUser.email, 'wrongpassword');
        const emailValue = await loginPage.loginForm.getEmailValue();
        const passwordValue = await loginPage.loginForm.getPasswordValue();
        (0, test_1.expect)(emailValue).toBe(adminUser.email);
        (0, test_1.expect)(passwordValue).toBe('wrongpassword');
    });
});
