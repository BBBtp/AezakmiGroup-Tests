import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('UI авторизации', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('Основные элементы страницы отображаются', async ({ loginPage }) => {
    await allure.allureId('786');

    await expect(loginPage.pageHeader.title).toBeVisible();
    await expect(loginPage.pageHeader.subtitle).toBeVisible();
    await loginPage.verifyPageContent();
    await expect(loginPage.loginForm.emailInput).toBeVisible();
    await expect(loginPage.loginForm.passwordInput).toBeVisible();
    await expect(loginPage.loginForm.submitButton).toBeVisible();
    await expect(loginPage.loginForm.forgotPasswordButton).toBeVisible();
  });

  test('Кнопка "Forgot password" открывает модальное окно', async ({ loginPage }) => {
    await allure.allureId('789');

    await loginPage.openForgotPasswordModal();
    await expect(loginPage.forgotPasswordModal.modal).toBeVisible();
    await expect(loginPage.forgotPasswordModal.telegramButton).toBeVisible();
  });

  test('Модальное окно восстановления пароля закрывается', async ({ loginPage }) => {
    await allure.allureId('790');

    await loginPage.openForgotPasswordModal();
    await loginPage.closeForgotPasswordModal();
    await expect(loginPage.forgotPasswordModal.modal).toBeHidden();
  });
});
