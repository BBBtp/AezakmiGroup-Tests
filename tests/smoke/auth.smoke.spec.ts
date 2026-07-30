import { test } from '@fixtures';
import { allure } from 'allure-playwright';

test.describe('Авторизация в CRM', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('Страница авторизации доступна и загружается', async ({ loginPage }) => {
    await allure.allureId('785');
    await loginPage.expectPageVisible();
  });

  test('Успешная авторизация администратора', async ({ loginPage, adminUser }) => {
    await allure.allureId('787');
    await loginPage.login(adminUser.email, adminUser.password);
    await loginPage.expectAuthenticated();
  });

  test('Успешная авторизация обычного пользователя', async ({ loginPage, regularUser }) => {
    await allure.allureId('788');
    await loginPage.login(regularUser.email, regularUser.password);
    await loginPage.expectAuthenticated();
  });
});
