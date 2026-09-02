import { allure } from 'allure-playwright';
import { test } from '@fixtures';

const protectedPaths = [
  '/dashboard',
  '/success-rate',
  '/subscriptions',
  '/keywords',
  '/checks',
  '/niches',
  '/sorted-apps',
  '/apps',
  '/ab-tests',
  '/kpi',
  '/employees',
  '/schedule',
  '/users',
  '/parameters',
];

test.describe('Контроль доступа', () => {
  test('[TC-1190] доступ к Parameters зависит от модуля и роли пользователя', async ({
    administrationPage,
    applicationShell,
    loginPage,
    parameterAccessUsers,
  }) => {
    await allure.allureId('1190');

    for (const user of parameterAccessUsers) {
      await test.step(`ПОДГОТОВКА · Войти под аккаунтом ${user.label}`, async () => {
        await loginPage.navigate();
        await loginPage.login(user.email, user.password);
        await loginPage.expectAuthenticated();
      });

      if (user.canAccessParameters) {
        await test.step(`ПРОВЕРКА · ${user.label} видит и открывает Parameters`, async () => {
          await applicationShell.expectSidebarDestination('Parameters', '/parameters');
          await administrationPage.openParametersFromSidebar();
        });
      } else {
        await test.step(`ПРОВЕРКА · ${user.label} не получает доступ к Parameters`, async () => {
          await applicationShell.expectSidebarDestinationHidden('Parameters');
          await administrationPage.expectParametersAccessBlocked();
          await loginPage.expectPageVisible();
        });
      }

      if (user.canAccessParameters) {
        await test.step(`ДЕЙСТВИЕ · Выйти из аккаунта ${user.label}`, async () => {
          await applicationShell.logout();
        });
      }
    }
  });

  test('[TC-567] Неавторизованный доступ к основным разделам заблокирован', async ({ authSessions }) => {
    await allure.allureId('567');

    await test.step('ПРОВЕРКА · Закрытые URL недоступны без сессии', async () => {
      await authSessions.expectAnonymousAccessBlocked(protectedPaths);
    });
  });

  test('[TC-568] Обычный пользователь не получает административные действия', async ({
    applicationShell,
    dashboardPage,
    loginPage,
    regularUser,
  }) => {
    await allure.allureId('568');

    await loginPage.navigate();
    await loginPage.login(regularUser.email, regularUser.password);
    await loginPage.expectAuthenticated();

    for (const destination of ['Employees', 'Users', 'Parameters']) {
      await applicationShell.expectSidebarDestinationHidden(destination);
    }

    for (const path of ['/users', '/parameters']) {
      await dashboardPage.navigateTo(path);
      await applicationShell.expectDangerousActionsHidden();
    }

    await dashboardPage.navigate();
  });
});
