import path from 'node:path';

import { allure } from 'allure-playwright';
import { expect } from '@playwright/test';

import { test } from '@fixtures';

const AUTH_FILE = path.resolve('.auth/admin.json');

test.describe('Сессия', () => {
  test('Logout полностью закрывает сессию', async ({
    dashboardPage,
    applicationShell,
    sessions,
    network,
  }) => {
    await allure.allureId('569');

    await dashboardPage.navigate();
    await applicationShell.logout();

    await dashboardPage.page.goBack();
    await expect(dashboardPage.page).toHaveURL(/\/login/);

    const page = await sessions.newPage({ storageState: AUTH_FILE });
    const pageNetwork = network.forPage(page);
    for (const protectedPath of ['/dashboard', '/kpi']) {
      await pageNetwork.navigate(protectedPath);
      await expect(page).toHaveURL(/\/dashboard|\/kpi/);
    }
  });

  test('Истекшая сессия блокирует чтение разделов CRM', async ({ sessions, network }) => {
    await allure.allureId('570');

    const page = await sessions.newPage({ storageState: AUTH_FILE });
    await expireSession(network.forPage(page), '/dashboard');

    const settingsPage = await sessions.newPage({ storageState: AUTH_FILE });
    await expireSession(network.forPage(settingsPage), '/kpi/settings');
  });
});

async function expireSession(
  network: import('@framework/network').NetworkController,
  targetPath: string,
): Promise<void> {
  const { page } = network;
  await network.navigate(targetPath);
  await page.evaluate(() => {
    localStorage.setItem('token', 'expired-invalid-token');
    localStorage.setItem('tokenExpiry', '0');
  });
  await network.reload();
  await expect(page).toHaveURL(/\/login/);
}
