import path from 'node:path';

import { allure } from 'allure-playwright';
import { expect } from '@playwright/test';

import { test } from '@fixtures';

const AUTH_FILE = path.resolve('.auth/admin.json');

test.describe('Сессия', () => {
  test('Logout полностью закрывает сессию', async ({ dashboardPage, applicationShell, sessions }) => {
    await allure.allureId('569');

    await dashboardPage.navigate();
    await applicationShell.logout();

    await dashboardPage.page.goBack();
    await expect(dashboardPage.page).toHaveURL(/\/login/);

    const page = await sessions.newPage({ storageState: AUTH_FILE });
    for (const protectedPath of ['/dashboard', '/kpi']) {
      await page.goto(protectedPath);
      await expect(page).toHaveURL(/\/dashboard|\/kpi/);
    }
  });

  test('Истекшая сессия блокирует чтение разделов CRM', async ({ sessions }) => {
    await allure.allureId('570');

    const page = await sessions.newPage({ storageState: AUTH_FILE });
    await expireSession(page, '/dashboard');

    const settingsPage = await sessions.newPage({ storageState: AUTH_FILE });
    await expireSession(settingsPage, '/kpi/settings');
  });
});

async function expireSession(page: import('@playwright/test').Page, targetPath: string): Promise<void> {
  await page.goto(targetPath);
  await page.evaluate(() => {
    localStorage.setItem('token', 'expired-invalid-token');
    localStorage.setItem('tokenExpiry', '0');
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
}
