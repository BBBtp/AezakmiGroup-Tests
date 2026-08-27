import { invalidUsers, test, testData as TestData } from '@fixtures';
import { allure } from 'allure-playwright';
test.describe('Валидация полей авторизации', () => {
  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('[TC-791] Валидация пустых полей', async ({ loginPage }) => {
    await allure.allureId('791');
    await loginPage.loginForm.submit();
    await loginPage.expectPageVisible();
    await loginPage.loginForm.assertInvalidEmailError();
    await loginPage.loginForm.assertInvalidPasswordError();
  });

  test('[TC-792] Валидация некорректного email формата', async ({ loginPage }) => {
    await allure.allureId('792');
    await loginPage.loginForm.fillCredentials(
      invalidUsers.invalidEmailFormat.email,
      invalidUsers.invalidEmailFormat.password,
    );
    await loginPage.loginForm.submit();
    await loginPage.expectPageVisible();
    await loginPage.loginForm.assertInvalidEmailError();
  });

  test('[TC-793] Неуспешная авторизация с неверным паролем', async ({ loginPage, adminUser }) => {
    await allure.allureId('793');
    await loginPage.login(adminUser.email, invalidUsers.wrongPassword.password);
    await loginPage.expectPageVisible();
    await loginPage.expectErrorVisible();
    await loginPage.expectErrorMessage(TestData.texts.login.errorMessages.invalidCredentials);
  });

  test('[TC-794] Неуспешная авторизация с несуществующим email', async ({ loginPage }) => {
    await allure.allureId('794');
    await loginPage.login(invalidUsers.wrongEmail.email, invalidUsers.wrongEmail.password);
    await loginPage.expectPageVisible();
    await loginPage.expectErrorMessage(TestData.texts.login.errorMessages.invalidCredentials);
  });
});
