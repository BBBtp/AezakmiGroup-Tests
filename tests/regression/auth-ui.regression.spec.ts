import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('UI авторизации', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('Основные элементы страницы отображаются', async ({ loginPage }) => {
    await allure.allureId('786');

    await loginPage.expectPrimaryControlsVisible();
  });

  test('Кнопка "Forgot password" открывает модальное окно', async ({ loginPage }) => {
    await allure.allureId('789');

    await loginPage.openForgotPasswordModal();
    await loginPage.forgotPasswordModal.expectContentVisible();
  });

  test('Модальное окно восстановления пароля закрывается', async ({ loginPage }) => {
    await allure.allureId('790');

    await loginPage.openForgotPasswordModal();
    await loginPage.closeForgotPasswordModal();
    await loginPage.forgotPasswordModal.expectHidden();
  });
});
