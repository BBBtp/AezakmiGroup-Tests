import { invalidUsers, test, testData as TestData } from '@fixtures';
import {expect} from "@playwright/test";
import { allure } from 'allure-playwright';
import { loggedClick } from '@utils/playwright-logger';
test.describe('Валидация полей авторизации', () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.navigate();
    });

    test('Валидация пустых полей', async ({ loginPage }) => {
        await allure.allureId('791');
        await loggedClick(loginPage.page, 'login validation: submit empty form', loginPage.loginForm.submitButton);
        await expect(loginPage.page).toHaveURL(/login/);
        await loginPage.loginForm.assertInvalidEmailError();
        await loginPage.loginForm.assertInvalidPasswordError();
    });

    test('Валидация некорректного email формата', async ({ loginPage }) => {
        await allure.allureId('792');
        await loginPage.loginForm.fillCredentials(
            invalidUsers.invalidEmailFormat.email,
            invalidUsers.invalidEmailFormat.password
        );
        await loggedClick(loginPage.page, 'login validation: submit invalid email', loginPage.loginForm.submitButton);
        await expect(loginPage.page).toHaveURL(/login/);
        await loginPage.loginForm.assertInvalidEmailError();
    });

    test('Неуспешная авторизация с неверным паролем', async ({ loginPage, adminUser }) => {
        await allure.allureId('793');
        await loginPage.login(adminUser.email, invalidUsers.wrongPassword.password);
        await expect(loginPage.page).toHaveURL(/login/);
        await expect(loginPage.errorMessage).toBeVisible();
        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toMatch(TestData.texts.login.errorMessages.invalidCredentials);
    });

    test('Неуспешная авторизация с несуществующим email', async ({ loginPage }) => {
        await allure.allureId('794');
        await loginPage.login(
            invalidUsers.wrongEmail.email,
            invalidUsers.wrongEmail.password
        );
        await expect(loginPage.page).toHaveURL(/login/);
        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toMatch(TestData.texts.login.errorMessages.invalidCredentials);
    });
});
