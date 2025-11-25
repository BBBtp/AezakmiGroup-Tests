"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_fixtures_1 = require("../../fixtures/test-fixtures");
const users_1 = require("../../fixtures/users");
const test_data_1 = __importDefault(require("../../fixtures/test-data"));
const test_1 = require("@playwright/test");
test_fixtures_1.test.describe('Валидация полей авторизации', () => {
    test_fixtures_1.test.beforeEach(async ({ loginPage }) => {
        await loginPage.navigate();
    });
    (0, test_fixtures_1.test)('Валидация пустых полей', async ({ loginPage }) => {
        await loginPage.loginForm.submitButton.click();
        await (0, test_1.expect)(loginPage.page).toHaveURL(/login/);
        await loginPage.loginForm.assertInvalidEmailError();
        await loginPage.loginForm.assertInvalidPasswordError();
    });
    (0, test_fixtures_1.test)('Валидация некорректного email формата', async ({ loginPage }) => {
        await loginPage.loginForm.fillCredentials(users_1.invalidUsers.invalidEmailFormat.email, users_1.invalidUsers.invalidEmailFormat.password);
        await loginPage.loginForm.submitButton.click();
        await (0, test_1.expect)(loginPage.page).toHaveURL(/login/);
        await loginPage.loginForm.assertInvalidEmailError();
    });
    (0, test_fixtures_1.test)('Неуспешная авторизация с неверным паролем', async ({ loginPage, adminUser }) => {
        await loginPage.login(adminUser.email, users_1.invalidUsers.wrongPassword.password);
        await (0, test_1.expect)(loginPage.page).toHaveURL(/login/);
        await (0, test_1.expect)(loginPage.errorMessage).toBeVisible();
        const errorMessage = await loginPage.getErrorMessage();
        (0, test_1.expect)(errorMessage).toMatch(test_data_1.default.texts.login.errorMessages.invalidCredentials);
    });
    (0, test_fixtures_1.test)('Неуспешная авторизация с несуществующим email', async ({ loginPage }) => {
        await loginPage.login(users_1.invalidUsers.wrongEmail.email, users_1.invalidUsers.wrongEmail.password);
        await (0, test_1.expect)(loginPage.page).toHaveURL(/login/);
        const errorMessage = await loginPage.getErrorMessage();
        (0, test_1.expect)(errorMessage).toMatch(test_data_1.default.texts.login.errorMessages.invalidCredentials);
    });
});
