import { allure } from 'allure-playwright';
import { test } from '@fixtures';

const protectedPaths = [
  '/dashboard',
  '/statistics',
  '/keywords',
  '/checks',
  '/niches',
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
});
