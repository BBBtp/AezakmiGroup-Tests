import path from 'node:path';

import { allure } from 'allure-playwright';

import { test } from '@fixtures';

const AUTH_FILE = path.resolve('.auth/admin.json');

test.describe('Сессия', () => {
  test('Logout полностью закрывает сессию', async ({ dashboardPage, applicationShell, authSessions }) => {
    await allure.allureId('569');

    await dashboardPage.navigate();
    await applicationShell.logoutAndExpectHistoryBlocked();
    await authSessions.expectStoredSessionAccess(AUTH_FILE, ['/dashboard', '/kpi']);
  });

  test('Истекшая сессия блокирует чтение разделов CRM', async ({ authSessions }) => {
    await allure.allureId('570');

    await authSessions.expectExpiredSessionBlocked(AUTH_FILE, ['/dashboard', '/kpi/settings']);
  });
});
