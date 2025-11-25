"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_fixtures_1 = require("../../fixtures/test-fixtures");
const test_1 = require("@playwright/test");
test_fixtures_1.test.describe('Авторизация в CRM', () => {
    test_fixtures_1.test.beforeEach(async ({ loginPage }) => {
        await loginPage.navigate();
    });
    (0, test_fixtures_1.test)('Страница авторизации доступна и загружается', async ({ loginPage }) => {
        await (0, test_1.expect)(loginPage.page).toHaveURL(/.*login/);
        await (0, test_1.expect)(loginPage.loginContainer).toBeVisible();
    });
    (0, test_fixtures_1.test)('Основные элементы страницы отображаются', async ({ loginPage }) => {
        await test_fixtures_1.test.step('Проверяем Title', async () => {
            await (0, test_1.expect)(loginPage.pageHeader.title).toBeVisible();
        });
        await test_fixtures_1.test.step('Проверяем SubTitle', async () => {
            await (0, test_1.expect)(loginPage.pageHeader.subtitle).toBeVisible();
        });
        await test_fixtures_1.test.step('Проверяем текст в Title и SubTitle', async () => {
            await loginPage.verifyPageContent();
        });
        await test_fixtures_1.test.step('Проверяем поле email', async () => {
            await (0, test_1.expect)(loginPage.loginForm.emailInput).toBeVisible();
        });
        await test_fixtures_1.test.step('Проверяем поле password', async () => {
            await (0, test_1.expect)(loginPage.loginForm.passwordInput).toBeVisible();
        });
        await test_fixtures_1.test.step('Проверяем кнопку входа', async () => {
            await (0, test_1.expect)(loginPage.loginForm.submitButton).toBeVisible();
        });
        await test_fixtures_1.test.step('Проверяем кнопку "Забыли пароль"', async () => {
            await (0, test_1.expect)(loginPage.loginForm.forgotPasswordButton).toBeVisible();
        });
    });
    (0, test_fixtures_1.test)('Успешная авторизация администратора', async ({ loginPage, adminUser, page }) => {
        await loginPage.login(adminUser.email, adminUser.password);
        await (0, test_1.expect)(page).toHaveURL(/dashboard/);
    });
    (0, test_fixtures_1.test)('Успешная авторизация обычного пользователя', async ({ loginPage, regularUser, page }) => {
        await loginPage.login(regularUser.email, regularUser.password);
        await (0, test_1.expect)(page).toHaveURL(/dashboard/);
    });
    (0, test_fixtures_1.test)('Кнопка "Forgot password" открывает модальное окно', async ({ loginPage }) => {
        await loginPage.openForgotPasswordModal();
        await (0, test_1.expect)(loginPage.forgotPasswordModal.modal).toBeVisible();
        await (0, test_1.expect)(loginPage.forgotPasswordModal.telegramButton).toBeVisible();
    });
    (0, test_fixtures_1.test)('Модальное окно восстановления пароля закрывается', async ({ loginPage }) => {
        await loginPage.openForgotPasswordModal();
        await loginPage.closeForgotPasswordModal();
        await (0, test_1.expect)(loginPage.forgotPasswordModal.modal).toBeHidden();
    });
});
