import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('UI авторизации', () => {
  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('[TC-786] Основные элементы страницы отображаются', async ({ loginPage }) => {
    await allure.allureId('786');

    await loginPage.expectPrimaryControlsVisible();
  });

  test('[TC-789] Кнопка "Forgot password" открывает модальное окно', async ({ loginPage }) => {
    await allure.allureId('789');

    await loginPage.openForgotPasswordModal();
    await loginPage.forgotPasswordModal.expectContentVisible();
  });

  test('[TC-790] Модальное окно восстановления пароля закрывается', async ({ loginPage }) => {
    await allure.allureId('790');

    await loginPage.openForgotPasswordModal();
    await loginPage.closeForgotPasswordModal();
    await loginPage.forgotPasswordModal.expectHidden();
  });
});
