import path from 'node:path';

import { allure } from 'allure-playwright';
import { expect } from '@playwright/test';

import { test } from '@fixtures';
import { loggedClick } from '@utils/playwright-logger';

const AUTH_FILE = path.resolve('.auth/admin.json');

test.describe('Сессия', () => {
  test('Logout полностью закрывает сессию', async ({ kpiPage, browser }) => {
    await allure.allureId('569');

    await kpiPage.page.goto('/dashboard');
    const logoutButton = kpiPage.page.locator('button[class*="logout"]');
    await loggedClick(kpiPage.page, 'profile: logout', logoutButton);
    await expect(kpiPage.page).toHaveURL(/\/login/);

    await kpiPage.page.goBack();
    await expect(kpiPage.page).toHaveURL(/\/login/);

    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();
    try {
      for (const protectedPath of ['/dashboard', '/kpi']) {
        await page.goto(protectedPath);
        await expect(page).toHaveURL(/\/dashboard|\/kpi/);
      }
    } finally {
      await context.close();
    }
  });

  test('Истекшая сессия блокирует чтение разделов CRM', async ({ browser }) => {
    await allure.allureId('570');

    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();
    try {
      await page.goto('/dashboard');
      await page.evaluate(() => {
        localStorage.setItem('token', 'expired-invalid-token');
        localStorage.setItem('tokenExpiry', '0');
      });
      await page.reload();
      await expect(page).toHaveURL(/\/login/);
    } finally {
      await context.close();
    }

    const settingsContext = await browser.newContext({ storageState: AUTH_FILE });
    const settingsPage = await settingsContext.newPage();
    try {
      await settingsPage.goto('/kpi/settings');
      await settingsPage.evaluate(() => {
        localStorage.setItem('token', 'expired-invalid-token');
        localStorage.setItem('tokenExpiry', '0');
      });
      await settingsPage.reload();
      await expect(settingsPage).toHaveURL(/\/login/);
    } finally {
      await settingsContext.close();
    }
  });
});
