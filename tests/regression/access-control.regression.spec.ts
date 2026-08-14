import { allure } from 'allure-playwright';
import { test } from '@fixtures';

const protectedPaths = [
  '/dashboard',
  '/success-rate',
  '/subscriptions',
  '/keywords',
  '/checks',
  '/niche-list',
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
  test('Неавторизованный доступ к основным разделам заблокирован', async ({ authSessions }) => {
    await allure.allureId('567');

    await test.step('Проверить доступ к закрытым URL без сессии', async () => {
      await authSessions.expectAnonymousAccessBlocked(protectedPaths);
    });
  });

  test('Обычный пользователь не получает административные действия', async ({
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
