import { invalidUsers, test, testData as TestData } from '@fixtures';
import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';
test.describe('Валидация полей авторизации', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('Валидация пустых полей', async ({ loginPage }) => {
    await allure.allureId('791');
    await loginPage.loginForm.submit();
    await loginPage.expectPageVisible();
    await loginPage.loginForm.assertInvalidEmailError();
    await loginPage.loginForm.assertInvalidPasswordError();
  });

  test('Валидация некорректного email формата', async ({ loginPage }) => {
    await allure.allureId('792');
    await loginPage.loginForm.fillCredentials(
      invalidUsers.invalidEmailFormat.email,
      invalidUsers.invalidEmailFormat.password,
    );
    await loginPage.loginForm.submit();
    await loginPage.expectPageVisible();
    await loginPage.loginForm.assertInvalidEmailError();
  });

  test('Неуспешная авторизация с неверным паролем', async ({ loginPage, adminUser }) => {
    await allure.allureId('793');
    await loginPage.login(adminUser.email, invalidUsers.wrongPassword.password);
    await loginPage.expectPageVisible();
    await loginPage.expectErrorVisible();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toMatch(TestData.texts.login.errorMessages.invalidCredentials);
  });

  test('Неуспешная авторизация с несуществующим email', async ({ loginPage }) => {
    await allure.allureId('794');
    await loginPage.login(invalidUsers.wrongEmail.email, invalidUsers.wrongEmail.password);
    await loginPage.expectPageVisible();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toMatch(TestData.texts.login.errorMessages.invalidCredentials);
  });
});
