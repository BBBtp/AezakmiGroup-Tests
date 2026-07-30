import { test } from '@fixtures';
import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Авторизация в CRM', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('Страница авторизации доступна и загружается', async ({ loginPage }) => {
    await allure.allureId('785');
    await expect(loginPage.page).toHaveURL(/.*login/);
    await expect(loginPage.loginContainer).toBeVisible();
  });

  test('Успешная авторизация администратора', async ({ loginPage, adminUser, page }) => {
    await allure.allureId('787');
    await loginPage.login(adminUser.email, adminUser.password);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('Успешная авторизация обычного пользователя', async ({ loginPage, regularUser, page }) => {
    await allure.allureId('788');
    await loginPage.login(regularUser.email, regularUser.password);
    await expect(page).toHaveURL(/dashboard/);
  });
});
