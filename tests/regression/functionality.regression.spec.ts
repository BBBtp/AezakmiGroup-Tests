import { test } from '@fixtures';
import { allure } from 'allure-playwright';
test.describe('Функциональность авторизации', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('Работа модального окна восстановления пароля', async ({ loginPage }) => {
    await allure.allureId('795');
    await loginPage.openForgotPasswordModal();
    await loginPage.forgotPasswordModal.expectContentVisible();
    await loginPage.forgotPasswordModal.closeByButton();
    await loginPage.forgotPasswordModal.expectHidden();
  });

  test('Закрытие модалки через оверлей', async ({ loginPage }) => {
    await allure.allureId('796');
    await loginPage.openForgotPasswordModal();
    await loginPage.forgotPasswordModal.expectContentVisible();
    await loginPage.forgotPasswordModal.closeByOverlay();
    await loginPage.forgotPasswordModal.expectHidden();
  });

  test('Кнопка "Remember me" работает (UI)', async ({ loginPage }) => {
    await allure.allureId('797');
    await loginPage.loginForm.expectRememberMeChecked(false);
    await loginPage.loginForm.toggleRememberMe();
    await loginPage.loginForm.expectRememberMeChecked(true);
    await loginPage.loginForm.toggleRememberMe();
    await loginPage.loginForm.expectRememberMeChecked(false);
  });

  test('Кнопка "Remember me" сохраняет сессию между перезапусками браузерного контекста', async ({
    adminUser,
    authSessions,
  }) => {
    await allure.allureId('798');
    await authSessions.expectRememberMePersists(adminUser);
  });

  test('Кнопка показа/скрытия пароля работает корректно', async ({ loginPage }) => {
    await allure.allureId('799');
    await loginPage.loginForm.expectPasswordType('password');
    await loginPage.loginForm.togglePasswordVisibility();
    await loginPage.loginForm.expectPasswordType('text');
    await loginPage.loginForm.togglePasswordVisibility();
    await loginPage.loginForm.expectPasswordType('password');
  });

  test('Переход по Telegram ссылке', async ({ loginPage }) => {
    await allure.allureId('800');
    await loginPage.openForgotPasswordModal();
    await loginPage.forgotPasswordModal.expectTelegramLink();
  });

  test('Поля сохраняют значения после неуспешной попытки', async ({ loginPage, adminUser }) => {
    await allure.allureId('801');
    await loginPage.login(adminUser.email, 'wrongpassword');
    await loginPage.loginForm.expectCredentialValues(adminUser.email, 'wrongpassword');
  });
});
