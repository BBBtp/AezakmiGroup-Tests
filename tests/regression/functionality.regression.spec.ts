import { test } from '../../fixtures/test-fixtures';
import {expect} from "@playwright/test";
test.describe('Функциональность авторизации', () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.navigate();
    });

    test('Работа модального окна восстановления пароля', async ({ loginPage }) => {
        await loginPage.openForgotPasswordModal();
        await expect(loginPage.forgotPasswordModal.modal).toBeVisible();
        await expect(loginPage.forgotPasswordModal.telegramButton).toBeVisible();
        await loginPage.forgotPasswordModal.closeByButton();
        await expect(loginPage.forgotPasswordModal.modal).toBeHidden();
    });

    test('Закрытие модалки через оверлей', async ({ loginPage }) => {
        await loginPage.openForgotPasswordModal();
        await expect(loginPage.forgotPasswordModal.modal).toBeVisible();
        await loginPage.forgotPasswordModal.closeByOverlay();
        await expect(loginPage.forgotPasswordModal.modal).toBeHidden();
    });

    test('Кнопка "Remember me" работает (UI)', async ({ loginPage, adminUser }) => {
        const initialState = await loginPage.loginForm.isRememberMeChecked();
        expect(initialState).toBe(false);
        await loginPage.loginForm.toggleRememberMe();
        const newState = await loginPage.loginForm.isRememberMeChecked();
        expect(newState).toBe(true);
        await loginPage.loginForm.toggleRememberMe();
        const finalState = await loginPage.loginForm.isRememberMeChecked();
        expect(finalState).toBe(false);
    });

    test('Кнопка "Remember me" работает (Functional)', async ({ browser, context, loginPage, adminUser }) => {
        await loginPage.loginForm.toggleRememberMe();
        await loginPage.login(adminUser.email, adminUser.password, { remember: true });
        const page2 = await context.newPage();
        await page2.goto('/dashboard');
        await expect(page2).toHaveURL(/dashboard/);
        await page2.close();
    });

    test('Кнопка показа/скрытия пароля работает корректно', async ({ loginPage }) => {
        await expect(loginPage.loginForm.passwordInput).toHaveAttribute('type', 'password');
        await loginPage.loginForm.toggleButtonPasswordVisibility.click();
        await expect(loginPage.loginForm.passwordInput).toHaveAttribute('type', 'text');
        await loginPage.loginForm.toggleButtonPasswordVisibility.click();
        await expect(loginPage.loginForm.passwordInput).toHaveAttribute('type', 'password')
    });

    test('Переход по Telegram ссылке', async ({ loginPage }) => {
        await loginPage.openForgotPasswordModal();
        const telegramHref = await loginPage.forgotPasswordModal.getTelegramButtonHref();
        expect(telegramHref).toBeTruthy();
        expect(telegramHref).toMatch(/t\.me|telegram/i);
    });

    test('Поля сохраняют значения после неуспешной попытки', async ({ loginPage, adminUser }) => {
        await loginPage.login(adminUser.email, 'wrongpassword');
        const emailValue = await loginPage.loginForm.getEmailValue();
        const passwordValue = await loginPage.loginForm.getPasswordValue();
        expect(emailValue).toBe(adminUser.email);
        expect(passwordValue).toBe('wrongpassword');
    });
});