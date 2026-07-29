import fs from 'node:fs/promises';
import path from 'node:path';

import { expect, test as setup } from '@playwright/test';

import { testUsers } from '@fixtures';
import { LoginPage } from '@modules/auth';

const adminStorageState = path.resolve('.auth/admin.json');

setup('создать авторизованное состояние администратора', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.loginForSetup(testUsers.admin.email, testUsers.admin.password);
  await expect(page).not.toHaveURL(/\/(?:login|auth|sign-in)(?:[/?]|$)/);

  await fs.mkdir(path.dirname(adminStorageState), { recursive: true });
  await page.context().storageState({ path: adminStorageState });
});
