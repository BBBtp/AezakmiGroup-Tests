import { test } from '@fixtures';
import { allure } from 'allure-playwright';

test.describe('Авторизация в CRM', () => {
  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('[TC-785] Страница авторизации доступна и загружается', async ({ loginPage }) => {
    await allure.allureId('785');
    await loginPage.expectPageVisible();
  });

  test('[TC-787] Успешная авторизация администратора', async ({ loginPage, adminUser }) => {
    await allure.allureId('787');
    await loginPage.login(adminUser.email, adminUser.password);
    await loginPage.expectAuthenticated();
  });

  test('[TC-788] Успешная авторизация обычного пользователя', async ({ loginPage, regularUser }) => {
    await allure.allureId('788');
    await loginPage.login(regularUser.email, regularUser.password);
    await loginPage.expectAuthenticated();
  });
});
