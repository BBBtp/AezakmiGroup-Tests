import { test } from '../../fixtures/test-fixtures';
import {expect} from "@playwright/test";


test.describe('Авторизация в CRM', () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.navigate();
    });

    test('Страница авторизации доступна и загружается', async ({ loginPage }) => {
        await expect(loginPage.page).toHaveURL(/.*login/);
        await expect(loginPage.loginContainer).toBeVisible();
    });

    test('Основные элементы страницы отображаются', async ({ loginPage }) => {
        await test.step('Проверяем Title', async () => {
            await expect(loginPage.pageHeader.title).toBeVisible()
        })
        await test.step('Проверяем SubTitle', async () => {
            await expect(loginPage.pageHeader.subtitle).toBeVisible()
        })
        await test.step('Проверяем текст в Title и SubTitle', async () => {
            await loginPage.verifyPageContent();
        })
        await test.step('Проверяем поле email', async () => {
            await expect(loginPage.loginForm.emailInput).toBeVisible();
        });
        await test.step('Проверяем поле password', async () => {
            await expect(loginPage.loginForm.passwordInput).toBeVisible();
        });
        await test.step('Проверяем кнопку входа', async () => {
            await expect(loginPage.loginForm.submitButton).toBeVisible();
        });
        await test.step('Проверяем кнопку "Забыли пароль"', async () => {
            await expect(loginPage.loginForm.forgotPasswordButton).toBeVisible();
        });

    });

    test('Успешная авторизация администратора', async ({ loginPage, adminUser, page }) => {
        await loginPage.login(adminUser.email, adminUser.password);
        await expect(page).toHaveURL(/dashboard/);
    });

    test('Успешная авторизация обычного пользователя', async ({ loginPage, regularUser, page }) => {
        await loginPage.login(regularUser.email, regularUser.password);
        await expect(page).toHaveURL(/dashboard/);
    });

    test('Кнопка "Forgot password" открывает модальное окно', async ({ loginPage }) => {
        await loginPage.openForgotPasswordModal();
        await expect(loginPage.forgotPasswordModal.modal).toBeVisible();
        await expect(loginPage.forgotPasswordModal.telegramButton).toBeVisible();
    });

    test('Модальное окно восстановления пароля закрывается', async ({ loginPage }) => {
        await loginPage.openForgotPasswordModal();
        await loginPage.closeForgotPasswordModal();
        await expect(loginPage.forgotPasswordModal.modal).toBeHidden();
    });
});