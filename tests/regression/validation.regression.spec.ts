import { test } from '../../fixtures/test-fixtures';
import { invalidUsers } from '../../fixtures/users';
import TestData from "../../fixtures/test-data";
import {expect} from "@playwright/test";
test.describe('Валидация полей авторизации', () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.navigate();
    });
    test('Валидация пустых полей', async ({ loginPage }) => {
        await loginPage.loginForm.submitButton.click();
        await expect(loginPage.page).toHaveURL(/login/);
        await loginPage.loginForm.assertInvalidEmailError();
        await loginPage.loginForm.assertInvalidPasswordError();
    });

    test('Валидация некорректного email формата', async ({ loginPage }) => {
        await loginPage.loginForm.fillCredentials(
            invalidUsers.invalidEmailFormat.email,
            invalidUsers.invalidEmailFormat.password
        );
        await loginPage.loginForm.submitButton.click();
        await expect(loginPage.page).toHaveURL(/login/);
        await loginPage.loginForm.assertInvalidEmailError();
    });

    test('Неуспешная авторизация с неверным паролем', async ({ loginPage, adminUser }) => {
        await loginPage.login(adminUser.email, invalidUsers.wrongPassword.password);
        await expect(loginPage.page).toHaveURL(/login/);
        await expect(loginPage.errorMessage).toBeVisible();
        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toMatch(TestData.texts.login.errorMessages.invalidCredentials);
    });

    test('Неуспешная авторизация с несуществующим email', async ({ loginPage }) => {
        await loginPage.login(
            invalidUsers.wrongEmail.email,
            invalidUsers.wrongEmail.password
        );
        await expect(loginPage.page).toHaveURL(/login/);
        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toMatch(TestData.texts.login.errorMessages.invalidCredentials);
    });
});